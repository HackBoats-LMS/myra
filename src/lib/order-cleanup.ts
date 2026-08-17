import { prisma } from "@/lib/prisma";
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
type ReleaseTx = Pick<
  Prisma.TransactionClient,
  "productVariant" | "product" | "coupon" | "couponUsage"
>;

export async function releaseReservedStock(
  tx: ReleaseTx,
  order: {
    orderItems: { variantId: string | null; productId: string; quantity: number }[];
    couponCode: string | null;
    userId: string;
  }
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
    await releaseCouponUse(tx, order.couponCode, order.userId);
  }
}

// Re-reserve stock for an order that had its reservation released after an
// abandoned payment window. Atomically decrements each item's stock only when
// there is enough available. Returns false (without side effects) if any item
// no longer has sufficient stock.
type ReReserveItem = { variantId: string | null; productId: string; quantity: number };
export async function reReserveStock(
  tx: ReleaseTx,
  orderItems: ReReserveItem[]
): Promise<boolean> {
  for (const item of orderItems) {
    if (item.variantId) {
      const res = await tx.productVariant.updateMany({
        where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (res.count === 0) return false;
    } else {
      const res = await tx.product.updateMany({
        where: { id: item.productId, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      if (res.count === 0) return false;
    }
  }
  return true;
}

// Best-effort re-reserve of the coupon slot for an order that had its
// reservation released. Skips (rather than fails) if the coupon is now expired,
// deleted, or at its usage/per-user limit — the order still ships with its
// stored discount, and the coupon count being under by one is an acceptable
// accounting edge case that is safe to reconcile later.
export async function reReserveCouponUse(
  tx: ReleaseTx,
  couponCode: string,
  userId: string
): Promise<void> {
  const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon) return;
  if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) return;

  await tx.coupon.update({
    where: { id: coupon.id },
    data: { timesUsed: { increment: 1 } },
  });

  if (coupon.maxUsesPerUser || coupon.type === "FIRST_ORDER" || coupon.type === "SINGLE_USE") {
    const usage = await tx.couponUsage.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } },
    });
    if (usage) {
      if (coupon.maxUsesPerUser && usage.count >= coupon.maxUsesPerUser) return;
      await tx.couponUsage.update({
        where: { id: usage.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await tx.couponUsage.create({
        data: { couponId: coupon.id, userId, count: 1 },
      }).catch(() => {});
    }
  }
}

// Release one reserved coupon use (global `timesUsed` plus the per-user
// `CouponUsage` row) so an abandoned/failed order never permanently burns a
// coupon. This must stay in sync with `cancelOrder`.
export async function releaseCouponUse(tx: ReleaseTx, couponCode: string, userId: string) {
  await tx.coupon.updateMany({
    where: { code: couponCode, timesUsed: { gt: 0 } },
    data: { timesUsed: { decrement: 1 } },
  });

  const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
  if (!coupon) return;
  const usage = await tx.couponUsage.findUnique({
    where: { couponId_userId: { couponId: coupon.id, userId } },
  });
  if (!usage) return;
  if (usage.count <= 1) {
    await tx.couponUsage.delete({ where: { id: usage.id } });
  } else {
    await tx.couponUsage.update({
      where: { id: usage.id },
      data: { count: { decrement: 1 } },
    });
  }
}

// Refund an online payment idempotently. The refund amount is claimed on the
// order BEFORE calling the gateway, so a gateway timeout + retry (or a racing
// webhook) cannot double-refund the customer. Returns true if a refund was
// issued, false if it was skipped because the amount was already refunded.
export async function refundPaymentIdempotent(options: {
  orderId: string;
  paymentId: string;
  amountPaise: number; // amount to refund, in paise
}): Promise<boolean> {
  const { orderId, paymentId, amountPaise } = options;
  if (!paymentId || !amountPaise || amountPaise <= 0) return false;
  const amountRupees = amountPaise / 100;

  // Atomic claim: only proceed if we haven't already refunded up to this amount.
  const claimed = await prisma.order.updateMany({
    where: { id: orderId, refundedAmount: { lt: amountRupees } },
    data: { refundedAmount: amountRupees },
  });
  if (claimed.count !== 1) {
    // Already refunded (or more); nothing to do.
    return false;
  }

  const { refundRazorpayPayment } = await import("@/lib/razorpay");
  try {
    await refundRazorpayPayment(paymentId, amountPaise);
    return true;
  } catch (err) {
    // The gateway call failed. First try to reconcile via the gateway's own
    // payment lookup: if the refund actually went through (e.g. the request
    // timed out after Razorpay processed it), keep the claim so a retry doesn't
    // double-refund.
    console.error("Refund call failed, reconciling", orderId, err);
    const { fetchRazorpayPayment } = await import("@/lib/razorpay");
    let refunded = false;
    try {
      const payment = await fetchRazorpayPayment(paymentId);
      const refundStatus = (payment as { refund_status?: string }).refund_status;
      refunded = refundStatus === "refunded" || refundStatus === "partial_refunded";
    } catch {
      /* ignore lookup failure */
    }
    if (refunded) return true;

    // The refund definitively did not happen — roll back the claim so a later
    // retry can still refund the customer instead of being permanently skipped.
    await prisma.order.updateMany({
      where: { id: orderId, refundedAmount: { gte: amountRupees } },
      data: { refundedAmount: { decrement: amountRupees } },
    }).catch((e) => console.error("Failed to roll back refund claim", orderId, e));
    return false;
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
    include: { orderItems: true, user: { select: { id: true } } },
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
        await releaseReservedStock(tx, {
          orderItems: order.orderItems,
          couponCode: order.couponCode,
          userId: order.user.id,
        });
      });
      if (didCancel) cancelled += 1;
    } catch (err) {
      console.error("Cleanup failed for order", order.id, err);
    }
  }

  return { scanned: stale.length, cancelled };
}
