import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { revalidateTag } from "next/cache";
import { verifyWebhookSignature } from "@/lib/integrations/razorpay";
import { CACHE_TAGS } from "@/lib/cache";

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

  const { order_id, id: paymentId, amount } = entity;

  try {
    if (event === "payment.captured") {
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId: order_id },
        include: {
          user: { select: { email: true, name: true } },
          orderItems: { include: { product: { select: { name: true } } } },
        },
      });
      if (order) {
        // Harden: only accept a captured amount that matches the order total
        // (Razorpay reports amounts in paise). Reject if amount is missing.
        if (!amount || Math.round(order.totalAmount * 100) !== amount) {
          console.error("Amount mismatch on capture", { order: order.id, expected: order.totalAmount, got: amount });
          return NextResponse.json({ ok: false, error: "amount_mismatch" }, { status: 400 });
        }

        // If the order was already cancelled (30-min cleanup, a prior payment
        // failure, or user cancel) while money was captured, the customer is
        // charged for a cancelled order. Refund it so they are not left out of
        // pocket, and never silently drop the capture.
        if (order.status === "CANCELLED") {
          await prisma.order.update({
            where: { id: order.id },
            data: { razorpayPaymentId: paymentId || order.razorpayPaymentId },
          });
          const { refundPaymentIdempotent } = await import("@/lib/order-cleanup");
          await refundPaymentIdempotent({
            orderId: order.id,
            paymentId: paymentId || order.razorpayPaymentId || "",
            amountPaise: Math.round(order.totalAmount * 100),
          }).catch((e) =>
            console.error("Auto-refund failed for cancelled order", order.id, e)
          );
          return NextResponse.json({ ok: true, refunded: true }, { status: 200 });
        }

        // Atomic claim: only the first path (webhook vs client confirm) that
        // flips UNPAID -> PAID sends emails, preventing duplicates on a race.
        const claimed = await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
          data: {
            paymentStatus: "PAID",
            razorpayPaymentId: paymentId || order.razorpayPaymentId,
          },
        });

        if (claimed.count === 1) {
          // Send the customer receipt (this webhook fires for every capture,
          // including Pay Now retries, so it must not be skipped).
          if (order.user?.email) {
            const { sendEmail } = await import("@/lib/email/email");
            const { default: OrderConfirmationEmail } = await import("@/emails/OrderConfirmationEmail");
            const userName = order.user.name || "Customer";
            await sendEmail({
              to: order.user.email,
              subject: `Your Myra Order Receipt #${order.id.substring(0, 8)}`,
              react: OrderConfirmationEmail({
                orderId: order.id,
                customerName: userName,
                totalAmount: order.totalAmount,
                items: order.orderItems.map((i) => ({
                  productId: i.productId,
                  name: i.product.name,
                  quantity: i.quantity,
                  price: i.price,
                })),
              }),
            }).catch(console.error);
          }

          // Notify admin of the online order.
          const { sendAdminNewOrderEmail } = await import("@/lib/email/email");
          sendAdminNewOrderEmail({
            orderId: order.id,
            customerName: order.user?.name || "Customer",
            totalAmount: order.totalAmount,
            paymentMethod: "Online (Razorpay)",
            itemCount: order.orderItems.reduce((sum, i) => sum + i.quantity, 0),
          }).catch(console.error);
        }
      } else {
        // No DB order matches this gateway order id. This can happen when a
        // retry re-linked the order to a new gateway order while the customer
        // actually completed payment on the old (now-orphaned) one. Try to
        // match by payment id so we can still mark the order paid / refund it.
        if (paymentId) {
          const orphaned = await prisma.order.findUnique({
            where: { razorpayPaymentId: paymentId },
          });
          if (orphaned) {
            await prisma.order.updateMany({
              where: { id: orphaned.id, paymentStatus: { not: "PAID" } },
              data: { paymentStatus: "PAID", razorpayPaymentId: paymentId },
            });
          }
        }
      }
    } else if (event === "payment.failed") {
      const order = await prisma.order.findUnique({
        where: { razorpayOrderId: order_id },
        include: { orderItems: true, user: { select: { id: true } } },
      });
      // Guard: never regress an already-paid order back to FAILED. Only move
      // UNPAID -> FAILED.
      if (order && order.paymentStatus !== "PAID") {
        await prisma.$transaction(async (tx) => {
          // Mark the order CANCELLED (not just FAILED) so the 30-min cleanup
          // routine, which only picks up PENDING orders, will NOT re-release the
          // reserved stock a second time. Release happens exactly once here.
          const res = await tx.order.updateMany({
            where: { id: order.id, paymentStatus: { in: ["UNPAID", "FAILED"] }, status: { not: "CANCELLED" } },
            data: {
              paymentStatus: "FAILED",
              status: "CANCELLED",
              cancelledAt: new Date(),
            },
          });
          if (res.count !== 1) return;

          // Payment failed / abandoned: release the reserved stock so it is not
          // permanently leaked by a never-paid online order.
          if (order.orderItems.length > 0) {
            const { releaseReservedStock } = await import("@/lib/order-cleanup");
            await releaseReservedStock(tx, {
              orderItems: order.orderItems.map((i) => ({
                variantId: i.variantId,
                productId: i.productId,
                quantity: i.quantity,
              })),
              couponCode: order.couponCode,
              userId: order.user.id,
            });
          }
        });
      }
    }

    revalidateTag(CACHE_TAGS.workerOrders, { expire: 0 });
    revalidateTag(CACHE_TAGS.deliveryOrders, { expire: 0 });
  } catch (err) {
    console.error("razorpay webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}