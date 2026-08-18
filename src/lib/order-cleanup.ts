import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";

// Razorpay orders are reserved (stock decremented) the moment checkout starts.
// If a customer abandons the checkout modal or the payment fails without a
// retry, the reserved stock must eventually be released. This routine finds
// online orders that were never paid and cancels them atomically.
const UNPAID_TTL_MINUTES = 30;
const BATCH_LIMIT = 200;

// Release reserved stock (and a coupon use, if any) back to inventory. Used
// whenever an unpaid/abandoned online order is cancelled or a payment fails,
// so reserved stock is never permanently leaked.
export async function releaseReservedStock(
  tx: Pick<Prisma.TransactionClient, "productVariant" | "product" | "coupon">,
  order: { orderItems: { variantId: string | null; productId: string; quantity: number }[]; couponCode: string | null }
) {
  for (const item of order.orderItems) {
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
  }

  if (order.couponCode) {
    await tx.coupon.updateMany({
      where: { code: order.couponCode, timesUsed: { gt: 0 } },
      data: { timesUsed: { decrement: 1 } },
    });
  }
}

export async function cleanupExpiredUnpaidOrders(
  cutoff = new Date(Date.now() - UNPAID_TTL_MINUTES * 60 * 1000)
): Promise<{ scanned: number; cancelled: number }> {
  const stale = await prisma.order.findMany({
    where: {
      paymentMethod: "RAZORPAY",
      paymentStatus: { in: ["UNPAID", "FAILED"] },
      status: "PENDING",
      createdAt: { lt: cutoff },
    },
    include: { orderItems: true },
    take: BATCH_LIMIT,
  });

  let cancelled = 0;
  for (const order of stale) {
    try {
      let didCancel = false;
      await prisma.$transaction(async (tx) => {
        // Guard: only cancel if the order is still pending and unpaid/failed,
        // so a concurrent webhook/confirm (payment completed) isn't clobbered.
        const res = await tx.order.updateMany({
          where: {
            id: order.id,
            paymentStatus: { in: ["UNPAID", "FAILED"] },
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancelledAt: new Date(),
          },
        });
        if (res.count !== 1) return;
        didCancel = true;

        // Release reserved stock back to inventory.
        await releaseReservedStock(tx, order);
      });
      if (didCancel) cancelled += 1;
    } catch (err) {
      console.error("Cleanup failed for order", order.id, err);
    }
  }

  return { scanned: stale.length, cancelled };
}
