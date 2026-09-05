import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { revalidateTag } from "next/cache";
import crypto from "crypto";
import { mapShiprocketStatus } from "@/lib/integrations/shiprocket";
import { CACHE_TAGS } from "@/lib/cache";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

interface TrackingWebhookPayload {
  awb?: string;
  courier_name?: string;
  current_status?: string;
  shipment_status?: string;
  order_id?: string | number;
  [key: string]: unknown;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  }
  const provided = req.headers.get("x-api-key");
  if (!provided) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Rate-limit webhook to prevent abuse (100 per minute)
  try {
    const ip = getClientIp(req);
    await checkRateLimit({ bucket: "webhook:tracking", key: ip, limit: 100, windowSeconds: 60 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }
    throw error;
  }

  let payload: TrackingWebhookPayload;
  try {
    payload = (await req.json()) as TrackingWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const status = payload.current_status || payload.shipment_status;
  const mapped = mapShiprocketStatus(status);
  const awb = payload.awb;
  const orderRef = payload.order_id ? String(payload.order_id) : undefined;

  if (!awb && !orderRef) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: orderRef
        ? { OR: [{ id: orderRef }, { shiprocketOrderId: orderRef }, { awbNumber: awb }] }
        : { awbNumber: awb },
      include: { user: { select: { email: true } } },
    });

    if (!order) {
      return NextResponse.json({ ok: true, ignored: "order_not_found" }, { status: 200 });
    }

    // Replay protection: ignore already-terminal statuses
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Idempotency: if this exact AWB + status was already applied, skip
    if (mapped && order.awbNumber === awb && order.status === mapped.status) {
      return NextResponse.json({ ok: true, ignored: "duplicate" }, { status: 200 });
    }

    const data: Record<string, unknown> = {};
    if (awb && !order.awbNumber) data.awbNumber = awb;
    if (payload.courier_name && !order.courierName) data.courierName = payload.courier_name;
    if (awb && !order.trackingUrl) data.trackingUrl = `https://shiprocket.co/tracking/${awb}`;

    let newStatus: string | null = null;
    if (mapped) {
      // Monotonicity guard: never regress to an earlier stage (stale/duplicate webhooks).
      const statusOrder = ["PENDING", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
      const currentRank = statusOrder.indexOf(order.status);
      const incomingRank = statusOrder.indexOf(mapped.status);
      if (incomingRank < 0 || incomingRank < currentRank) {
        return NextResponse.json({ ok: true, ignored: "stale_status" }, { status: 200 });
      }
      newStatus = mapped.status;
      data.status = mapped.status;
      data[mapped.timestampField] = new Date();

      // If COD order is delivered, courier collected cash at doorstep -> mark payment as PAID
      if (mapped.status === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus !== "PAID") {
        data.paymentStatus = "PAID";
      }
    }

    await prisma.order.update({ where: { id: order.id }, data });

    // Status changed -> refresh the worker/delivery dashboards immediately.
    revalidateTag(CACHE_TAGS.workerOrders, { expire: 0 });
    revalidateTag(CACHE_TAGS.deliveryOrders, { expire: 0 });

    if (newStatus && order.user?.email) {
      if (newStatus === "SHIPPED") {
        import("@/lib/email/email").then(({ sendOrderShippedEmail }) =>
          sendOrderShippedEmail(order.user.email!, order.id).catch(console.error)
        );
      } else if (newStatus === "DELIVERED") {
        import("@/lib/email/email").then(({ sendOrderDeliveredEmail }) =>
          sendOrderDeliveredEmail(order.user.email!, order.id).catch(console.error)
        );
      }
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
