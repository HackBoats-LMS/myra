import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        amount?: number;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const raw = await req.text();

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(raw) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const event = payload.event || "";
  const entity = payload.payload?.payment?.entity;

  if (!entity) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { order_id, id: paymentId, status } = entity;

  try {
    if (event === "payment.captured") {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId: order_id } });
      if (order && order.paymentStatus !== "PAID") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            razorpayPaymentId: paymentId || order.razorpayPaymentId,
          },
        });
      }
    } else if (event === "payment.failed") {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId: order_id } });
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: status === "authorized" ? order.paymentStatus : "FAILED",
          },
        });
      }
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}