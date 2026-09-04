import { prisma } from "@/lib/db/prisma";

let cachedToken: { value: string; expiresAt: number } | null = null;

const API_URL = process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in";
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // Shiprocket JWT valid ~10 days; refresh before expiry

export function shiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

interface LoginResponse {
  token?: string;
  [key: string]: unknown;
}

async function login(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("Shiprocket is not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
  }

  const res = await fetch(`${API_URL}/v1/external/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Shiprocket login failed (${res.status}).`);
  }

  const data = (await res.json()) as LoginResponse;
  if (!data.token) {
    throw new Error("Shiprocket login returned no token.");
  }

  cachedToken = { value: data.token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return data.token;
}

export async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  return login();
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });

  if (res.status === 401) {
    // Only retry once after a fresh login to prevent infinite recursion.
    if (init && (init as Record<string, unknown>)._retried) {
      throw new Error("Shiprocket authentication failed after retry.");
    }
    cachedToken = null;
    await login(); // Force fresh token
    return api<T>(path, { ...init, _retried: true } as RequestInit);
  }

  if (!res.ok) {
    await res.text(); // consume response body
    throw new Error(`Shiprocket API error (${res.status})`);
  }

  return (await res.json()) as T;
}

interface AdhocOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  shipping_phone: string;
  order_items: {
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }[];
  payment_method: "COD" | "Prepaid";
  shipping_charges: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

type OrderForShipment = Awaited<ReturnType<typeof loadOrderForShipment>>;

export async function loadOrderForShipment(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          addressLine1: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      },
      address: true,
      orderItems: { include: { product: { select: { name: true, sku: true, id: true } } } },
    },
  });
}

function digits(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "").slice(0, 10) || "0000000000";
}

export function buildAdhocPayload(order: NonNullable<OrderForShipment>): AdhocOrderPayload {
  const user = order.user;
  const addr = order.address;
  
  const billingNameFull = user.name || "Customer";
  const billingNameParts = billingNameFull.split(" ");
  const billingFirstName = billingNameParts[0];
  const billingLastName = billingNameParts.slice(1).join(" ") || "Customer";

  const shippingNameFull = order.giftName || user.name || "Customer";
  const shippingNameParts = shippingNameFull.split(" ");
  const shippingFirstName = shippingNameParts[0];
  const shippingLastName = shippingNameParts.slice(1).join(" ") || "Customer";

  const shippingAddress = order.giftAddressLine1 || addr?.addressLine1 || user.addressLine1 || "Address";
  const shippingCity = order.giftCity || addr?.city || user.city || "City";
  const shippingState = order.giftState || addr?.state || user.state || "State";
  const shippingPincode = order.giftPostalCode || addr?.postalCode || user.postalCode || "000000";
  const shippingCountry = order.giftCountry || addr?.country || user.country || "India";
  const shippingPhone = order.giftPhone || addr?.phone || user.phoneNumber || "0000000000";

  const weight =
    Number(process.env.SHIPROCKET_PACKAGE_WEIGHT || 1) || 1;
  const dim = Number(process.env.SHIPROCKET_PACKAGE_DIM || 10) || 10;

  return {
    order_id: order.id,
    order_date: new Date(order.createdAt)
      .toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })
      .replace("T", " "),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Main Store",
    billing_customer_name: billingFirstName,
    billing_last_name: billingLastName,
    billing_address: addr?.addressLine1 || user.addressLine1 || "Address",
    billing_city: addr?.city || user.city || "City",
    billing_state: addr?.state || user.state || "State",
    billing_pincode: addr?.postalCode || user.postalCode || "000000",
    billing_country: addr?.country || user.country || "India",
    billing_email: user.email || "customer@myra.com",
    billing_phone: digits(addr?.phone || user.phoneNumber),
    shipping_is_billing: false,
    shipping_customer_name: shippingFirstName,
    shipping_last_name: shippingLastName,
    shipping_address: shippingAddress,
    shipping_city: shippingCity,
    shipping_state: shippingState,
    shipping_pincode: shippingPincode,
    shipping_country: shippingCountry,
    shipping_phone: digits(shippingPhone),
    order_items: order.orderItems.map((item) => ({
      name: item.product.name,
      sku: item.product.sku || item.product.id.slice(0, 10),
      units: item.quantity,
      selling_price: Math.round(item.price),
    })),
    payment_method: order.paymentMethod === "RAZORPAY" && order.paymentStatus === "PAID" ? "Prepaid" : "COD",
    shipping_charges: Math.round(order.shippingAmount || 0),
    // Shiprocket computes the grand total as sub_total + shipping_charges, so
    // sub_total must be the items-only subtotal (shipping/tax are excluded here).
    sub_total: Math.round(
      order.orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    ),
    length: dim,
    breadth: dim,
    height: dim,
    weight,
  };
}

interface CreateOrderResponse {
  order_id: number;
  shipment_id: number;
  awb_code?: string;
  courier_name?: string;
  [key: string]: unknown;
}

export async function createShipment(orderId: string) {
  const order = await loadOrderForShipment(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const payload = buildAdhocPayload(order);
  const created = await api<CreateOrderResponse>("/v1/external/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!created.order_id || !created.shipment_id) {
    console.error("Shiprocket create/adhoc failed. order_id:", created.order_id, "shipment_id:", created.shipment_id);
    throw new Error("Failed to create order on Shiprocket.");
  }

  const shiprocketOrderId = String(created.order_id);
  const shipmentId = String(created.shipment_id);

  return { shiprocketOrderId, shipmentId, awbCode: created.awb_code || "", courierName: created.courier_name || "" };
}

interface GeneratePickupResponse {
  shipment_id: number;
  pickup_scheduled_date?: string;
  awb_code?: string;
  courier_name?: string;
  [key: string]: unknown;
}

export async function assignAwbAndSchedulePickup(shipmentId: string) {
  // 1. Assign AWB
  const awb = await api<{ shipment_id?: number; awb_code?: string; courier_name?: string; [key: string]: unknown }>(
    "/v1/external/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify({ shipment_id: Number(shipmentId) }),
    }
  );

  // 2. Generate Pickup
  const pickup = await api<GeneratePickupResponse>("/v1/external/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({
      shipment_id: Number(shipmentId),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Main Store",
    }),
  });

  return {
    awbCode: pickup.awb_code || awb.awb_code || "",
    courierName: pickup.courier_name || awb.courier_name || "",
    trackingUrl: pickup.awb_code 
      ? `https://shiprocket.co/tracking/${pickup.awb_code}` 
      : awb.awb_code
      ? `https://shiprocket.co/tracking/${awb.awb_code}`
      : "",
  };
}

interface GenerateLabelResponse {
  label_created?: number;
  label_url?: string;
  [key: string]: unknown;
}

export async function generateLabelUrl(shipmentId: string) {
  const res = await api<GenerateLabelResponse>("/v1/external/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({
      shipment_id: [Number(shipmentId)],
    }),
  });

  return res.label_url;
}

interface TrackResponse {
  tracking_data?: {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: Array<{
      id?: number;
      awb_code?: string;
      courier_name?: string;
      current_status?: string;
      shipment_id?: number | string;
      tracking_url?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function trackShipment(awb: string) {
  return api<TrackResponse>(`/v1/external/courier/track/awb/${encodeURIComponent(awb)}`);
}

interface CreateReturnOrderResponse {
  order_id?: number;
  shipment_id?: number;
  awb_code?: string;
  courier_name?: string;
  [key: string]: unknown;
}

export async function createReturnOrder(requestId: string) {
  const request = await prisma.returnRequest.findUnique({
    where: { id: requestId },
    include: {
      order: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
              addressLine1: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
            },
          },
          address: true,
        },
      },
      orderItem: { include: { product: { select: { name: true, sku: true, id: true } } } },
    },
  });

  if (!request) {
    throw new Error("Return request not found.");
  }

  const order = request.order;
  const user = order.user;
  const addr = order.address;

  // The customer's delivery address is where the courier picks up the returned item.
  const pickupName = order.giftName || user.name || "Customer";
  const pickupAddress = order.giftAddressLine1 || addr?.addressLine1 || user.addressLine1 || "Address";
  const pickupCity = order.giftCity || addr?.city || user.city || "City";
  const pickupState = order.giftState || addr?.state || user.state || "State";
  const pickupPincode = order.giftPostalCode || addr?.postalCode || user.postalCode || "000000";
  const pickupCountry = order.giftCountry || addr?.country || user.country || "India";
  const pickupPhone = order.giftPhone || addr?.phone || user.phoneNumber || "0000000000";
  const pickupEmail = user.email || "customer@myra.com";

  const weight = Number(process.env.SHIPROCKET_PACKAGE_WEIGHT || 1) || 1;
  const dim = Number(process.env.SHIPROCKET_PACKAGE_DIM || 10) || 10;
  const storeName = process.env.SHIPROCKET_STORE_NAME || "Myra";
  const storeAddress = process.env.SHIPROCKET_STORE_ADDRESS || "Address";
  const storeCity = process.env.SHIPROCKET_STORE_CITY || "City";
  const storeState = process.env.SHIPROCKET_STORE_STATE || "State";
  const storePincode = process.env.SHIPROCKET_STORE_PINCODE || "000000";

  const order_id = `RT-${request.id.slice(0, 16)}`;

  const payload = {
    order_id,
    order_date: new Date(request.requestedAt)
      .toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })
      .replace("T", " "),
    pickup_customer_name: pickupName.split(" ")[0] || "Customer",
    pickup_last_name: pickupName.split(" ").slice(1).join(" ") || "",
    pickup_address: pickupAddress,
    pickup_city: pickupCity,
    pickup_state: pickupState,
    pickup_country: pickupCountry,
    pickup_pincode: pickupPincode,
    pickup_email: pickupEmail,
    pickup_phone: digits(pickupPhone),
    pickup_isd_code: "91",
    shipping_customer_name: storeName,
    shipping_address: storeAddress,
    shipping_city: storeCity,
    shipping_state: storeState,
    shipping_pincode: storePincode,
    shipping_country: "India",
    shipping_email: process.env.SHIPROCKET_EMAIL || "store@myra.com",
    shipping_phone: digits(process.env.SHIPROCKET_PHONE),
    shipping_isd_code: "91",
    order_items: [
      {
        sku: request.orderItem.product.sku || request.orderItem.product.id.slice(0, 10),
        name: request.orderItem.product.name,
        units: request.orderItem.quantity,
        selling_price: Math.round(request.orderItem.price),
        discount: 0,
        qc_enable: true,
      },
    ],
    payment_method: "Prepaid",
    total_discount: "0",
    sub_total: Math.round(request.orderItem.price * request.orderItem.quantity),
    length: dim,
    breadth: dim,
    height: dim,
    weight,
  };

  const created = await api<CreateReturnOrderResponse>("/v1/external/orders/create/return", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    orderId: order_id,
    shiprocketOrderId: String(created.order_id ?? ""),
    shipmentId: String(created.shipment_id ?? ""),
    awbCode: created.awb_code || "",
    courierName: created.courier_name || "",
  };
}

export async function assignAwbAndScheduleReturnPickup(shipmentId: string) {
  const awb = await api<{ shipment_id?: number; awb_code?: string; courier_name?: string; [key: string]: unknown }>(
    "/v1/external/courier/assign/awb",
    {
      method: "POST",
      body: JSON.stringify({ shipment_id: Number(shipmentId), is_return: 1 }),
    }
  );

  const pickup = await api<{ shipment_id?: number; awb_code?: string; courier_name?: string; [key: string]: unknown }>(
    "/v1/external/courier/generate/pickup",
    {
      method: "POST",
      body: JSON.stringify({
        shipment_id: Number(shipmentId),
        pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Main Store",
      }),
    }
  );

  return {
    awbCode: pickup.awb_code || awb.awb_code || "",
    courierName: pickup.courier_name || awb.courier_name || "",
    trackingUrl: pickup.awb_code
      ? `https://shiprocket.co/tracking/${pickup.awb_code}`
      : awb.awb_code
      ? `https://shiprocket.co/tracking/${awb.awb_code}`
      : "",
  };
}

export function mapShiprocketStatus(status: string | null | undefined): {
  status: string;
  timestampField: string;
} | null {
  const s = (status || "").toUpperCase();
  if (s.includes("DELIVERED")) {
    return { status: "DELIVERED", timestampField: "deliveredAt" };
  }
  if (s.includes("OUT FOR DELIVERY")) {
    return { status: "OUT_FOR_DELIVERY", timestampField: "outForDeliveryAt" };
  }
  if (s.includes("IN TRANSIT") || s.includes("PICKED UP")) {
    return { status: "SHIPPED", timestampField: "shippedAt" };
  }
  if (s.includes("MANIFEST") || s.includes("READY")) {
    return { status: "READY_TO_SHIP", timestampField: "readyToShipAt" };
  }
  if (s.includes("CANCEL") || s.includes("RTO") || s.includes("FAILED") || s.includes("NOT DELIVERED")) {
    return { status: "CANCELLED", timestampField: "cancelledAt" };
  }
  return null;
}

export async function checkServiceability(deliveryPincode: string, cod: boolean = false): Promise<{ available: boolean; city?: string; state?: string; estimatedDeliveryDays?: number }> {
  try {
    let pickupPincode = process.env.SHIPROCKET_STORE_PINCODE || "110030";
    if (pickupPincode === "000000") pickupPincode = "110030"; // Fix dummy env value
    
    const weight = process.env.SHIPROCKET_PACKAGE_WEIGHT || 1;
    const isCod = cod ? 1 : 0;
    const url = `/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${isCod}`;
    
    const res = await api<any>(url);
    
    if (res?.status === 200 && res.data?.available_courier_companies?.length > 0) {
      // Pick the first available courier to extract city and state information
      const courier = res.data.available_courier_companies[0];
      return { 
        available: true, 
        city: courier.city, 
        state: courier.state,
        estimatedDeliveryDays: parseInt(courier.estimated_delivery_days) || undefined
      };
    }
    return { available: false };
  } catch (error) {
    console.error("Shiprocket serviceability error:", error);
    return { available: false };
  }
}
