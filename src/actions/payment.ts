"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { createOrderTransaction, estimateCheckoutTotal, type GiftDetails } from "@/actions/cart";
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

  // Estimate the total first (read-only) so the Razorpay order can be created
  // before any DB order / stock side effects occur. This avoids orphan orders
  // or a lost cart if the gateway call fails.
  const { finalAmount } = await estimateCheckoutTotal({ userId, couponCode: input.couponCode });

  const rzOrder = await createRazorpayOrder({
    amount: Math.round(finalAmount * 100),
    currency: "INR",
    receipt: `${userId.slice(0, 8)}-${Date.now()}`,
    notes: { userId },
  });

  // Phase A: reserve the order (UNPAID) once the Razorpay order exists.
  const result = await createOrderTransaction({
    userId,
    addressId: input.addressId,
    couponCode: input.couponCode,
    phone: input.phone,
    gift: input.gift,
    paymentMethod: "RAZORPAY",
    paymentStatus: "UNPAID",
    razorpayOrderId: rzOrder.id,
  });

  return {
    razorpayOrderId: rzOrder.id,
    amount: Math.round(result.finalAmount * 100),
    currency: "INR",
    keyId: getRazorpayKeyId(),
    orderId: result.orderId,
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

  // Idempotent: if already marked paid (e.g. webhook fired first), return.
  if (order.paymentStatus === "PAID") {
    return { orderId: order.id };
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  const userName = session.user.name || "Customer";
  const userEmail = session.user.email;

  if (userEmail) {
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: updated.id },
      include: { product: { select: { name: true } } },
    });
    await sendEmail({
      to: userEmail,
      subject: `Your Myra Order Receipt #${updated.id.substring(0, 8)}`,
      react: OrderConfirmationEmail({
        orderId: updated.id,
        customerName: userName,
        totalAmount: updated.totalAmount,
        items: orderItems.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
        })),
      }),
    });
    // Notify admin of the new online order.
    const { sendAdminNewOrderEmail } = await import("@/lib/email");
    sendAdminNewOrderEmail({
      orderId: updated.id,
      customerName: userName,
      totalAmount: updated.totalAmount,
      paymentMethod: "Online (Razorpay)",
      itemCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
    }).catch(console.error);
  }

  revalidatePath("/");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.cart(session.user.id));

  return { orderId: order.id };
}