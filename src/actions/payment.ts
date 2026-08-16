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

  // Reserve the order (UNPAID) first so the amount charged reflects the exact
  // reserved totals (coupon, flash, shipping). The Razorpay order is then
  // created from this authoritative amount and linked back to the order.
  const result = await createOrderTransaction({
    addressId: input.addressId,
    couponCode: input.couponCode,
    phone: input.phone,
    gift: input.gift,
    paymentMethod: "RAZORPAY",
    paymentStatus: "UNPAID",
    razorpayOrderId: null,
    allowAutoApply: input.allowAutoApply !== false,
  });

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

  // Atomic claim: only the first path (client confirm vs webhook) that flips
  // UNPAID -> PAID proceeds to send emails, preventing duplicates on a race.
  // A CANCELLED order (e.g. cleaned up after 30 min) can never be charged.
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
    data: { paymentStatus: "PAID", razorpayPaymentId, razorpaySignature },
  });

  // If the webhook already marked it paid, treat this as idempotent success.
  if (claimed.count === 0) {
    return { orderId: order.id };
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