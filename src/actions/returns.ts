"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyAdmin } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { shiprocketConfigured, createReturnOrder, assignAwbAndScheduleReturnPickup } from "@/lib/shiprocket";
import { refundRazorpayPayment, razorpayConfigured } from "@/lib/razorpay";

const REQUESTABLE_STATUSES = ["PENDING", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

const RETURN_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const RETURN_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadReturnImage(file: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided.");
  }
  if (!RETURN_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  if (file.size > RETURN_IMAGE_MAX_BYTES) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Storage is not configured.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/return-images/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload: ${err}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/return-images/${fileName}`;
}

async function requireCustomer() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to request a return.");
  }
  return session.user.id;
}

export async function requestReturn(
  orderItemId: string,
  type: "RETURN" | "REPLACEMENT",
  reason: string,
  images: string[] = []
) {
  const session = await requireCustomer();
  const userId = session;

  const cleanReason = (reason || "").trim();
  if (!cleanReason) {
    throw new Error("Please provide a reason for the return.");
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { user: { select: { name: true } } } }, product: { select: { name: true } } },
  });

  if (!item || item.order.userId !== userId) {
    throw new Error("Order item not found.");
  }

  if (item.order.status === "CANCELLED") {
    throw new Error("Cannot request a return for a cancelled order.");
  }

  if (!REQUESTABLE_STATUSES.includes(item.order.status as (typeof REQUESTABLE_STATUSES)[number])) {
    throw new Error("This order cannot be returned yet.");
  }

  const existingActive = await prisma.returnRequest.findFirst({
    where: {
      orderItemId,
      status: { in: ["PENDING", "APPROVED", "PICKED_UP"] },
    },
  });

  if (existingActive) {
    throw new Error("A return or replacement request is already active for this item.");
  }

  const created = await prisma.returnRequest.create({
    data: {
      orderId: item.orderId,
      orderItemId: item.id,
      userId,
      type,
      reason: cleanReason,
      images: images.slice(0, 5),
    },
  });

  await logAudit("return.request", "ReturnRequest", item.orderId, {
    orderItemId,
    type,
    reason: cleanReason,
  });

  // Notify admin of the new return request.
  {
    const { sendAdminNewReturnEmail } = await import("@/lib/email");
    sendAdminNewReturnEmail({
      requestId: created.id,
      itemName: item.product.name,
      reason: cleanReason,
      customerName: item.order.user.name || "Customer",
    }).catch(console.error);
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${item.orderId}`);
  revalidatePath("/admin/returns");
}

export async function cancelReturnRequest(requestId: string) {
  const userId = await requireCustomer();

  const request = await prisma.returnRequest.findUnique({ where: { id: requestId } });

  if (!request || request.userId !== userId) {
    throw new Error("Return request not found.");
  }

  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled.");
  }

  await prisma.returnRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  await logAudit("return.cancel", "ReturnRequest", requestId);

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${request.orderId}`);
  revalidatePath("/admin/returns");
}

async function getRequest(requestId: string) {
  await verifyAdmin();
  const request = await prisma.returnRequest.findUnique({
    where: { id: requestId },
    include: { order: true, orderItem: { include: { product: true } }, user: true },
  });
  if (!request) {
    throw new Error("Return request not found.");
  }
  return request;
}

async function setAdminId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function approveReturn(requestId: string, adminNote?: string) {
  const request = await getRequest(requestId);
  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be approved.");
  }

  await prisma.returnRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      adminNote: adminNote?.trim() || null,
      adminId: await setAdminId(),
      processedAt: new Date(),
    },
  });

  await logAudit("return.approve", "ReturnRequest", requestId);

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${requestId}`);
  revalidatePath(`/account/orders/${request.orderId}`);
}

export async function rejectReturn(requestId: string, adminNote?: string) {
  const request = await getRequest(requestId);
  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be rejected.");
  }

  await prisma.returnRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      adminNote: adminNote?.trim() || null,
      adminId: await setAdminId(),
      processedAt: new Date(),
    },
  });

  await logAudit("return.reject", "ReturnRequest", requestId, { adminNote });

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${requestId}`);
  revalidatePath(`/account/orders/${request.orderId}`);
}

export async function scheduleReversePickup(requestId: string) {
  await verifyAdmin();

  const request = await prisma.returnRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new Error("Return request not found.");
  }
  if (request.status !== "APPROVED") {
    throw new Error("Only approved requests can schedule a reverse pickup.");
  }
  if (!shiprocketConfigured()) {
    throw new Error(
      "Shiprocket is not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to .env, or mark the return as picked up manually."
    );
  }

  const created = await createReturnOrder(requestId);

  let awbCode = created.awbCode;

  if (created.shipmentId && !awbCode) {
    try {
      const pickup = await assignAwbAndScheduleReturnPickup(created.shipmentId);
      awbCode = pickup.awbCode;
    } catch {
      // AWB assignment can be async; the return order is created and pickup will be scheduled later.
    }
  }

  await prisma.returnRequest.update({
    where: { id: requestId },
    data: {
      shiprocketReturnOrderId: created.shiprocketOrderId || null,
      shipmentId: created.shipmentId || null,
      awbNumber: awbCode || null,
      reversePickupScheduledAt: new Date(),
      adminId: await setAdminId(),
    },
  });

  await logAudit("return.schedulePickup", "ReturnRequest", requestId, {
    shiprocketOrderId: created.shiprocketOrderId,
    awb: awbCode,
  });

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${requestId}`);
  revalidatePath(`/account/orders/${request.orderId}`);
}

export async function markReturnPickedUp(requestId: string) {
  const request = await getRequest(requestId);
  if (request.status !== "APPROVED") {
    throw new Error("Only approved requests can be picked up.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.returnRequest.update({
      where: { id: requestId },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
        adminId: await setAdminId(),
      },
    });

    const item = await tx.orderItem.findUnique({ where: { id: request.orderItemId } });
    if (!item) return;

    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
  });

  await logAudit("return.pickup", "ReturnRequest", requestId);

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${request.orderId}`);
  revalidatePath("/admin/inventory");
}

export async function issueReturnRefund(requestId: string, amount: number) {
  const request = await getRequest(requestId);
  if (request.status !== "PICKED_UP") {
    throw new Error("Goods must be picked up before issuing a refund.");
  }
  if (request.type !== "RETURN") {
    throw new Error("Only return requests can be refunded.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Please enter a valid refund amount.");
  }

  const remaining = request.order.totalAmount - (request.order.refundedAmount || 0);
  const itemLineTotal = request.orderItem.price * request.orderItem.quantity;
  const maxRefundable = Math.min(itemLineTotal, remaining);
  if (amount > maxRefundable) {
    throw new Error(`Cannot refund more than ₹${maxRefundable.toFixed(2)} for this item.`);
  }

  // Push the refund to Razorpay when the order was paid online.
  if (request.order.paymentMethod === "RAZORPAY" && request.order.razorpayPaymentId) {
    if (!razorpayConfigured()) {
      throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to issue online refunds.");
    }
    await refundRazorpayPayment(request.order.razorpayPaymentId, amount * 100);
  }

  const newRefundedAmount = (request.order.refundedAmount || 0) + amount;
  const nextStatus = newRefundedAmount >= request.order.totalAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: request.orderId },
      data: {
        refundedAmount: { increment: amount },
        paymentStatus: request.order.paymentMethod === "RAZORPAY" ? nextStatus : request.order.paymentStatus,
      },
    });

    await tx.returnRequest.update({
      where: { id: requestId },
      data: {
        status: "REFUNDED",
        refundAmount: amount,
        refundedAt: new Date(),
        adminId: await setAdminId(),
      },
    });
  });

  await logAudit("return.refund", "ReturnRequest", requestId, { amount });

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${requestId}`);
  revalidatePath(`/admin/orders/${request.orderId}`);
  revalidatePath(`/account/orders/${request.orderId}`);
}

export async function markReturnReplaced(requestId: string) {
  const request = await getRequest(requestId);
  if (request.type !== "REPLACEMENT") {
    throw new Error("This request is not a replacement.");
  }
  if (request.status !== "PICKED_UP") {
    throw new Error("Goods must be picked up before shipping the replacement.");
  }

  await prisma.returnRequest.update({
    where: { id: requestId },
    data: {
      status: "REPLACED",
      replacedAt: new Date(),
      adminId: await setAdminId(),
    },
  });

  await logAudit("return.replace", "ReturnRequest", requestId);

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${requestId}`);
  revalidatePath(`/account/orders/${request.orderId}`);
}
