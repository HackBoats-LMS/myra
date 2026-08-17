"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { createOrderTransaction, type GiftDetails } from "@/actions/cart";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  razorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { CACHE_TAGS } from "@/lib/cache";

interface InitiatePaymentInput {
  addressId: string;
  couponCode?: string;
  phone?: string;
  gift?: GiftDetails;
  allowAutoApply?: boolean;
  couponIsAutoApplied?: boolean;
}

export async function initiateRazorpayPayment(input: InitiatePaymentInput): Promise<{
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to checkout.");
  }
  if (!razorpayConfigured()) {
    throw new Error(
      "Online payments are not configured yet. Please choose Cash on Delivery, or try again shortly."
    );
  }

  const userId = session.user.id;

  // Idempotency: if there's already an UNPAID Razorpay order for this user
  // (created by a prior attempt in this same checkout that was abandoned but
  // not yet cleaned up), reuse it rather than reserving stock/coupon a second
  // time. This prevents double reservations and double coupon consumption on
  // re-click of "Pay Now".
  //
  // Only reuse while the cart is EMPTY — creating an order empties the cart, so
  // an empty cart means this is the same in-flight checkout. If the cart has
  // items, the user has changed/re-added products and this is a DIFFERENT
  // checkout; charging against the old order would bill them the old amount and
  // items. In that case we create a fresh order and the stale one is released
  // by the periodic stale-order job.
  const cartItemCount = await prisma.cartItem.count({
    where: { cart: { userId } },
  });
  const existing =
    cartItemCount === 0
      ? await prisma.order.findFirst({
          where: {
            userId,
            paymentMethod: "RAZORPAY",
            paymentStatus: "UNPAID",
            status: "PENDING",
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

  let result: Awaited<ReturnType<typeof createOrderTransaction>>;
  if (existing) {
    result = {
      orderId: existing.id,
      finalAmount: existing.totalAmount,
      subtotal: existing.totalAmount - existing.discountAmount - existing.shippingAmount,
      discountAmount: existing.discountAmount,
      shippingAmount: existing.shippingAmount,
      appliedCouponCode: existing.couponCode,
      items: [],
    };
    // If the prior attempt's reservation was released after abandonment, re-reserve
    // before charging so we never bill for items that are no longer available.
    await reReserveIfReleased(existing);
  } else {
    // Reserve the order (UNPAID) first so the amount charged reflects the exact
    // reserved totals (coupon, flash, shipping). The Razorpay order is then
    // created from this authoritative amount and linked back to the order.
    result = await createOrderTransaction({
      addressId: input.addressId,
      couponCode: input.couponCode,
      phone: input.phone,
      gift: input.gift,
      paymentMethod: "RAZORPAY",
      paymentStatus: "UNPAID",
      razorpayOrderId: null,
      allowAutoApply: input.allowAutoApply !== false,
      couponIsAutoApplied: input.couponIsAutoApplied === true,
    });
  }

  const rzOrder = await createRazorpayOrder({
    amount: Math.round(result.finalAmount * 100),
    currency: "INR",
    receipt: `${userId.slice(0, 8)}-${Date.now()}`,
    notes: { userId, orderId: result.orderId },
  });

  await prisma.order.update({
    where: { id: result.orderId },
    data: { razorpayOrderId: rzOrder.id },
  });

  return {
    razorpayOrderId: rzOrder.id,
    amount: Math.round(result.finalAmount * 100),
    currency: "INR",
    keyId: getRazorpayKeyId(),
    orderId: result.orderId,
  };
}

export async function retryRazorpayPayment(orderId: string): Promise<{
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to pay.");
  }
  if (!razorpayConfigured()) {
    throw new Error("Online payments are not configured yet. Please try again shortly.");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    throw new Error("Order not found.");
  }
  if (order.paymentMethod !== "RAZORPAY") {
    throw new Error("This order cannot be paid online.");
  }
  if (order.paymentStatus === "PAID") {
    throw new Error("This order has already been paid.");
  }
  if (order.status === "CANCELLED") {
    throw new Error("This order was cancelled and cannot be paid.");
  }

  // Re-reserve stock/coupon if the previous payment window was abandoned and the
  // reservation was released, so a retry charges only for available items.
  await reReserveIfReleased(order);

  // Create a fresh Razorpay order for the existing amount (the previous gateway
  // order may have been abandoned/expired) and re-link it so the confirmation
  // step can find this order by its razorpayOrderId.
  const rzOrder = await createRazorpayOrder({
    amount: Math.round(order.totalAmount * 100),
    currency: "INR",
    receipt: `${order.id.slice(0, 8)}-retry-${Date.now()}`,
    notes: { userId: session.user.id, orderId: order.id },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: rzOrder.id },
  });

  return {
    razorpayOrderId: rzOrder.id,
    amount: Math.round(order.totalAmount * 100),
    currency: "INR",
    keyId: getRazorpayKeyId(),
    orderId: order.id,
  };
}

// If the order's stock/coupon reservation was released (an abandoned payment
// window), re-reserve it exactly once, atomically, before a fresh Razorpay order
// is issued. Guarded by the `stockReleased` flag so concurrent attempts can't
// double-reserve. Throws (and rolls back) if an item is no longer in stock.
async function reReserveIfReleased(order: {
  id: string;
  userId: string;
  couponCode: string | null;
  stockReleased: boolean;
  status: string;
  paymentStatus: string;
  razorpayPaymentId: string | null;
}): Promise<void> {
  if (!order.stockReleased) return;

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: order.id,
        stockReleased: true,
        status: "PENDING",
        paymentStatus: "UNPAID",
        razorpayPaymentId: null,
      },
      data: { stockReleased: false },
    });
    if (claimed.count !== 1) return; // a concurrent attempt already re-reserved

    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
      select: { productId: true, variantId: true, quantity: true },
    });
    const { reReserveStock, reReserveCouponUse } = await import("@/lib/order-cleanup");
    const ok = await reReserveStock(tx, items);
    if (!ok) {
      throw new Error("Some items are no longer in stock. Please update your cart and try again.");
    }
    if (order.couponCode) await reReserveCouponUse(tx, order.couponCode, order.userId);
  });
}

// Release the stock/coupon reserved for an online order when the customer closes
// the Razorpay payment window without paying. Idempotent and owner-only; a later
// "Pay Now" retry re-reserves via reReserveIfReleased. The 30-min cleanup job
// remains as a backstop for abandonment that bypasses the modal (e.g. closing the
// browser tab).
export async function releaseRazorpayReservation(orderId: string): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("You must be logged in.");
  const userId = session.user.id;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw new Error("Order not found.");
  if (order.paymentMethod !== "RAZORPAY") return;

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        userId,
        paymentMethod: "RAZORPAY",
        status: "PENDING",
        paymentStatus: "UNPAID",
        razorpayPaymentId: null,
        stockReleased: false,
      },
      data: { stockReleased: true, razorpayOrderId: null },
    });
    if (claimed.count !== 1) return; // already paid, released, or cancelled

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, variantId: true, quantity: true },
    });
    const { releaseReservedStock } = await import("@/lib/order-cleanup");
    await releaseReservedStock(tx, {
      orderItems: items,
      couponCode: order.couponCode,
      userId,
    });
  });

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account");
}

interface ConfirmPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function confirmRazorpayPayment(input: ConfirmPaymentInput): Promise<{ orderId: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to complete checkout.");
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error("Incomplete payment response from Razorpay.");
  }

  // Server-side signature verification — never trust the client.
  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    throw new Error("Payment verification failed. Please contact support.");
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
  if (!order) {
    throw new Error("Order not found for this payment.");
  }
  if (order.userId !== session.user.id) {
    throw new Error("You are not authorized to complete this order.");
  }

  // If the order was already cancelled (30-min cleanup, payment failure, or
  // user cancel) but money was captured, surface an error so the caller can
  // inform the customer rather than falsely reporting success.
  if (order.status === "CANCELLED") {
    // Trigger the auto-refund (money was captured against a cancelled order).
    const { refundPaymentIdempotent } = await import("@/lib/order-cleanup");
    await refundPaymentIdempotent({
      orderId: order.id,
      paymentId: razorpayPaymentId,
      amountPaise: Math.round(order.totalAmount * 100),
    }).catch((e) =>
      console.error("Auto-refund failed for cancelled order", order.id, e)
    );
    throw new Error("Your payment was captured but the order was cancelled. A refund has been initiated.");
  }

  // Atomic claim: only the first path (client confirm vs webhook) that flips
  // UNPAID -> PAID proceeds to send emails, preventing duplicates on a race.
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
    data: { paymentStatus: "PAID", razorpayPaymentId, razorpaySignature },
  });

  // If the webhook already marked it paid, treat this as idempotent success.
  if (claimed.count === 0) {
    // Distinguish: if it's already PAID, that's a success; otherwise (e.g. it
    // was cancelled in the race window) surface an error instead.
    const current = await prisma.order.findUnique({ where: { id: order.id } });
    if (current?.paymentStatus === "PAID") {
      return { orderId: order.id };
    }
    throw new Error("This order is no longer payable. Please contact support.");
  }

  const userName = session.user.name || "Customer";
  const userEmail = session.user.email;

  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: { product: { select: { name: true } } },
  });

  // Email failures must never block the payment confirmation/redirect, since
  // the order is already marked PAID at this point.
  if (userEmail) {
    sendEmail({
      to: userEmail,
      subject: `Your Myra Order Receipt #${order.id.substring(0, 8)}`,
      react: OrderConfirmationEmail({
        orderId: order.id,
        customerName: userName,
        totalAmount: order.totalAmount,
        items: orderItems.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
        })),
      }),
    }).catch(console.error);
  }

  // Notify admin of the new online order (independent of the customer email).
  const { sendAdminNewOrderEmail } = await import("@/lib/email");
  sendAdminNewOrderEmail({
    orderId: order.id,
    customerName: userName,
    totalAmount: order.totalAmount,
    paymentMethod: "Online (Razorpay)",
    itemCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
  }).catch(console.error);

  revalidatePath("/");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.cart(session.user.id));

  return { orderId: order.id };
}