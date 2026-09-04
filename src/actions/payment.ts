"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { sendEmail } from "@/lib/email/email";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { calculateCartCheckoutPricing, createOrderTransaction, type GiftDetails } from "@/actions/cart";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  razorpayConfigured,
  verifyRazorpaySignature,
  fetchRazorpayOrder,
} from "@/lib/integrations/razorpay";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
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

  // Rate-limit payment initiation to prevent API flooding
  try {
    await checkRateLimit({ bucket: "pay:init", key: session.user.id, limit: 10, windowSeconds: 900 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error("Too many payment attempts. Please try again later.");
    }
    throw error;
  }

  const userId = session.user.id;

  // Calculate totals directly from current cart without creating an unpaid DB order
  // or clearing the user's cart. The cart items and DB order are only finalized
  // once the customer successfully authorizes and confirms payment.
  const pricing = await calculateCartCheckoutPricing({
    couponCode: input.couponCode,
    allowAutoApply: input.allowAutoApply !== false,
  });

  const notes: Record<string, string> = {
    userId,
    addressId: input.addressId || "",
    phone: input.phone || "",
    couponCode: input.couponCode || "",
    lockedAmount: String(Math.round(pricing.finalAmount * 100)),
  };
  if (input.gift) {
    notes.gift = JSON.stringify(input.gift).slice(0, 250);
  }

  const rzOrder = await createRazorpayOrder({
    amount: Math.round(pricing.finalAmount * 100),
    currency: "INR",
    receipt: `${userId.slice(0, 8)}-${Date.now()}`,
    notes,
  });

  return {
    razorpayOrderId: rzOrder.id,
    amount: Math.round(pricing.finalAmount * 100),
    currency: "INR",
    keyId: getRazorpayKeyId(),
    orderId: rzOrder.id,
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

export interface ConfirmPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  addressId?: string;
  couponCode?: string;
  phone?: string;
  gift?: GiftDetails;
  allowAutoApply?: boolean;
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

  const existingOrder = await prisma.order.findUnique({ where: { razorpayOrderId } });

  // If order already exists (e.g. from retry flow or webhook already processed):
  if (existingOrder) {
    if (existingOrder.userId !== session.user.id) {
      throw new Error("You are not authorized to complete this order.");
    }

    const claimed = await prisma.order.updateMany({
      where: { id: existingOrder.id, paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
      data: { paymentStatus: "PAID", razorpayPaymentId, razorpaySignature },
    });

    if (claimed.count === 0) {
      return { orderId: existingOrder.id };
    }

    const userName = session.user.name || "Customer";
    const userEmail = session.user.email;
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: existingOrder.id },
      include: { product: { select: { name: true } } },
    });

    if (userEmail) {
      sendEmail({
        to: userEmail,
        subject: `Your Myra Order Receipt #${existingOrder.id.substring(0, 8)}`,
        react: OrderConfirmationEmail({
          orderId: existingOrder.id,
          customerName: userName,
          totalAmount: existingOrder.totalAmount,
          items: orderItems.map((i) => ({
            productId: i.productId,
            name: i.product.name,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      }).catch(console.error);
    }

    revalidatePath("/", "layout");
    revalidateTag(CACHE_TAGS.products);
    revalidateTag(CACHE_TAGS.cart(session.user.id));
    return { orderId: existingOrder.id };
  }

  // Normal fresh checkout flow: create the DB order, decrement stock, and clear cart
  // only NOW after the payment has been authenticated and captured.

  // Verify that the cart total hasn't changed since the Razorpay order was created.
  // The lockedAmount was stored in the Razorpay order notes at initiation time.
  try {
    const rzOrder = await fetchRazorpayOrder(razorpayOrderId);
    const orderData = rzOrder as unknown as { notes?: Record<string, string> };
    const lockedAmountStr = orderData.notes?.lockedAmount;
    if (lockedAmountStr) {
      const lockedAmount = Number(lockedAmountStr);
      const currentPricing = await calculateCartCheckoutPricing({
        couponCode: input.couponCode,
        allowAutoApply: input.allowAutoApply !== false,
      });
      const currentAmount = Math.round(currentPricing.finalAmount * 100);
      if (lockedAmount !== currentAmount) {
        throw new Error(
          "Your cart total has changed since you initiated payment. Please go back to your cart and try again."
        );
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("cart total has changed")) {
      throw error;
    }
    // If we can't verify (e.g. Razorpay API error), proceed — the webhook
    // amount check provides a secondary safety net.
  }

  const result = await createOrderTransaction({
    addressId: input.addressId || "",
    couponCode: input.couponCode,
    phone: input.phone,
    gift: input.gift,
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    allowAutoApply: input.allowAutoApply !== false,
  });

  const userName = session.user.name || "Customer";
  const userEmail = session.user.email;

  if (userEmail) {
    sendEmail({
      to: userEmail,
      subject: `Your Myra Order Receipt #${result.orderId.substring(0, 8)}`,
      react: OrderConfirmationEmail({
        orderId: result.orderId,
        customerName: userName,
        totalAmount: result.finalAmount,
        items: result.items,
      }),
    }).catch(console.error);
  }

  // Notify admin of the new online order.
  const { sendAdminNewOrderEmail } = await import("@/lib/email/email");
  sendAdminNewOrderEmail({
    orderId: result.orderId,
    customerName: userName,
    totalAmount: result.finalAmount,
    paymentMethod: "Online (Razorpay)",
    itemCount: result.items.reduce((sum, i) => sum + i.quantity, 0),
  }).catch(console.error);

  revalidatePath("/", "layout");
  revalidateTag(CACHE_TAGS.products);
  revalidateTag(CACHE_TAGS.cart(session.user.id));

  return { orderId: result.orderId };
}
