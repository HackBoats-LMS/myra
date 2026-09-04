"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/auth/auth-utils";

import { z } from "zod";

const userProfileSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").max(100).optional().nullable(),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().nullable(),
  phoneNumber2: z.string().regex(/^\d{10}$/, "Second phone number must be exactly 10 digits").optional().nullable(),
  addressLine1: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
});

export async function updateUserProfile(formData: FormData) {
  const userId = await verifyUser();
  
  const rawData = {
    name: formData.get("name") ? String(formData.get("name")).trim() : null,
    email: formData.get("email") ? String(formData.get("email")).trim() : null,
    phoneNumber: formData.get("phoneNumber") ? String(formData.get("phoneNumber")).trim() : null,
    phoneNumber2: formData.get("phoneNumber2") ? String(formData.get("phoneNumber2")).trim() : null,
    addressLine1: formData.get("addressLine1") ? String(formData.get("addressLine1")).trim() : null,
    city: formData.get("city") ? String(formData.get("city")).trim() : null,
    state: formData.get("state") ? String(formData.get("state")).trim() : null,
    postalCode: formData.get("postalCode") ? String(formData.get("postalCode")).trim() : null,
    country: formData.get("country") ? String(formData.get("country")).trim() : null,
  };

  const result = userProfileSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const data = result.data;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (data.email) {
    const emailConflict = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (emailConflict) {
      throw new Error("This email address is already in use by another account.");
    }
  }

  const canUpdatePhone = !existingUser?.phoneNumber;

  // Secondary number can be set/changed freely, but must differ from the primary.
  const phoneNumber2 = data.phoneNumber2;
  if (phoneNumber2) {
    if (phoneNumber2 === (data.phoneNumber || existingUser?.phoneNumber)) {
      throw new Error("Second phone number must be different from the primary number.");
    }
    const conflict = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber: phoneNumber2 }, { phoneNumber2 }], id: { not: userId } },
    });
    if (conflict) {
      throw new Error("This phone number is already in use by another account.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      addressLine1: data.addressLine1,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      ...(canUpdatePhone && data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      phoneNumber2: data.phoneNumber2 || null,
    }
  });

  revalidatePath("/account");
}

export async function changePassword(formData: FormData) {
  const userId = await verifyUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  // Rate-limit password change attempts to prevent brute-force
  const { checkRateLimit } = await import("@/lib/rate-limit");
  try {
    await checkRateLimit({ bucket: "pwchange:id", key: userId, limit: 5, windowSeconds: 900 });
  } catch {
    throw new Error("Too many password change attempts. Please try again later.");
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("All fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  if (newPassword.length > 128) {
    throw new Error("Password must not exceed 128 characters.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.password) {
    throw new Error("Incorrect current password.");
  }

  const bcrypt = await import("bcryptjs");
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isPasswordValid) {
    throw new Error("Incorrect current password.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

export async function setPassword(formData: FormData) {
  const userId = await verifyUser();
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const { checkRateLimit } = await import("@/lib/rate-limit");
  try {
    await checkRateLimit({ bucket: "pwset:id", key: userId, limit: 5, windowSeconds: 900 });
  } catch {
    throw new Error("Too many attempts. Please try again later.");
  }

  if (!newPassword || !confirmPassword) {
    throw new Error("All fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
  if (newPassword.length > 128) {
    throw new Error("Password must not exceed 128 characters.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.password) {
    throw new Error("Password already set.");
  }

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

export async function reorderOrder(orderId: string) {
  const userId = await verifyUser();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }
  if (order.status === "CANCELLED") {
    throw new Error("Cancelled orders cannot be reordered.");
  }
  if (order.orderItems.length === 0) {
    throw new Error("This order has no items to reorder.");
  }

  const { addToCart } = await import("@/actions/cart");
  const availableProducts = await prisma.product.findMany({
    where: { id: { in: order.orderItems.map((i) => i.productId) }, deletedAt: null },
    select: { id: true, stockQuantity: true },
  });
  const available = new Map(availableProducts.map((p) => [p.id, p.stockQuantity]));

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: order.orderItems.filter((i) => i.variantId).map((i) => i.variantId!) } },
    select: { id: true, stockQuantity: true },
  });
  const variantStock = new Map(variants.map((v) => [v.id, v.stockQuantity]));

  let added = 0;
  for (const item of order.orderItems) {
    if (!available.has(item.productId)) continue;
    if (item.variantId) {
      if ((variantStock.get(item.variantId) ?? 0) <= 0) continue;
    } else if ((available.get(item.productId) ?? 0) <= 0) {
      continue;
    }
    await addToCart(item.productId, item.quantity, item.variantId || undefined);
    added += 1;
  }

  if (added === 0) {
    throw new Error("None of the items in this order are currently available.");
  }

  revalidatePath("/cart");
}

export async function cancelOrder(orderId: string, reason?: string, itemIds?: string[]) {
  const userId = await verifyUser();

  const { checkRateLimit } = await import("@/lib/rate-limit");
  try {
    await checkRateLimit({ bucket: "cancel:id", key: userId, limit: 10, windowSeconds: 300 });
  } catch {
    throw new Error("Too many cancellation attempts. Please try again later.");
  }

  let needsRefund = false;
  let refundAmount = 0;
  let razorpayPaymentId: string | null = null;
  let isPartial = false;

  await prisma.$transaction(async (tx) => {
    const fullOrder = await tx.order.findUnique({ 
      where: { id: orderId, userId },
      include: { orderItems: true }
    });
    
    if (!fullOrder) throw new Error("Order not found or unauthorized.");
    if (fullOrder.status !== "PENDING") {
      throw new Error("Only pending orders can be cancelled.");
    }

    const uncancelledItems = fullOrder.orderItems.filter(i => !i.isCancelled);
    const itemIdsToCancel = itemIds || uncancelledItems.map(i => i.id);
    
    // Verify itemIds belong to this order and are active
    const validItemsToCancel = uncancelledItems.filter(i => itemIdsToCancel.includes(i.id));
    
    if (validItemsToCancel.length === 0) {
      throw new Error("No valid items to cancel.");
    }

    isPartial = validItemsToCancel.length < uncancelledItems.length;

    // Calculate refund amount
    refundAmount = validItemsToCancel.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (reason) {
      const sanitizedReason = reason.replace(/<[^>]*>/g, "").trim().substring(0, 500);
      const existingNotes = fullOrder.internalNotes ? fullOrder.internalNotes + "\n\n" : "";
      await tx.order.update({
        where: { id: orderId },
        data: { internalNotes: existingNotes + `CANCELLATION REASON: ${sanitizedReason}` + (isPartial ? ` (Partial Cancellation)` : "") },
      });
    }

    // Mark items as cancelled
    await tx.orderItem.updateMany({
      where: { id: { in: validItemsToCancel.map(i => i.id) } },
      data: { isCancelled: true }
    });

    if (isPartial) {
      if (fullOrder.paymentStatus === "PAID" && refundAmount > 0 && fullOrder.razorpayPaymentId) {
        needsRefund = true;
        razorpayPaymentId = fullOrder.razorpayPaymentId;
        
        await tx.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: (fullOrder.refundedAmount + refundAmount >= fullOrder.totalAmount) ? "REFUNDED" : "PARTIALLY_REFUNDED", 
            refundedAmount: { increment: refundAmount } 
          },
        });
      }
    } else {
      // Full cancellation
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      if (fullOrder.paymentStatus === "PAID" && fullOrder.totalAmount > 0 && fullOrder.razorpayPaymentId) {
        needsRefund = true;
        refundAmount = fullOrder.totalAmount; // Full refund of total including shipping
        razorpayPaymentId = fullOrder.razorpayPaymentId;
        
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "REFUNDED", refundedAmount: refundAmount },
        });
      }
      
      // Restore coupons for full cancellation only
      if (fullOrder.couponCode) {
        await tx.coupon.updateMany({
          where: { code: fullOrder.couponCode, timesUsed: { gt: 0 } },
          data: { timesUsed: { decrement: 1 } },
        });

        const coupon = await tx.coupon.findUnique({ where: { code: fullOrder.couponCode } });
        if (coupon) {
          const usage = await tx.couponUsage.findUnique({
            where: { couponId_userId: { couponId: coupon.id, userId } },
          });
          if (usage) {
            if (usage.count <= 1) {
              await tx.couponUsage.delete({ where: { id: usage.id } });
            } else {
              await tx.couponUsage.update({
                where: { id: usage.id },
                data: { count: { decrement: 1 } },
              });
            }
          }
        }
      }
    }

    // Restore stock
    for (const item of validItemsToCancel) {
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
  });

  if (needsRefund && razorpayPaymentId) {
    try {
      const { refundRazorpayPayment } = await import("@/lib/integrations/razorpay");
      await refundRazorpayPayment(razorpayPaymentId, refundAmount * 100);
    } catch (err) {
      console.error("Automatic refund failed for order", orderId, err);
      // Revert the REFUNDED status if full, or decrement if partial
      if (isPartial) {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: "PAID", // We just set it to PAID for admin to review
            refundedAmount: { decrement: refundAmount } 
          }
        });
      } else {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PAID", refundedAmount: 0 }
        });
      }
      throw new Error(`Order ${isPartial ? 'partially ' : ''}cancelled, but automatic refund failed. Please contact support.`);
    }
  }

  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateOrderDeliveryAddress(orderId: string, addressId: string) {
  const userId = await verifyUser();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }
  if (order.status !== "PENDING") {
    throw new Error("Delivery address can only be changed before the order is packed or shipped.");
  }

  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new Error("Address not found.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      addressId,
      giftName: null,
      giftPhone: null,
      giftAddressLine1: null,
      giftCity: null,
      giftState: null,
      giftPostalCode: null,
      giftCountry: null,
    },
  });

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}



