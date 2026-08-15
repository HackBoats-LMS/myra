"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/auth-utils";

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

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("All fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match.");
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.password) {
    throw new Error("User not found or password not set.");
  }

  const bcrypt = await import("bcryptjs");
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isPasswordValid) {
    throw new Error("Incorrect current password.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

export async function setPassword(formData: FormData) {
  const userId = await verifyUser();
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!newPassword || !confirmPassword) {
    throw new Error("All fields are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.password) {
    throw new Error("Password already set. Use change password instead.");
  }

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(newPassword, 10);

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
  const available = new Set(availableProducts.map((p) => p.id));

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: order.orderItems.filter((i) => i.variantId).map((i) => i.variantId!) } },
    select: { id: true, stockQuantity: true },
  });
  const variantStock = new Map(variants.map((v) => [v.id, v.stockQuantity]));

  let added = 0;
  for (const item of order.orderItems) {
    if (!available.has(item.productId)) continue;
    if (item.variantId && (variantStock.get(item.variantId) ?? 0) <= 0) continue;
    await addToCart(item.productId, item.quantity, item.variantId || undefined);
    added += 1;
  }

  if (added === 0) {
    throw new Error("None of the items in this order are currently available.");
  }

  revalidatePath("/cart");
}

export async function cancelOrder(orderId: string) {
  const userId = await verifyUser();

  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "PENDING") {
    throw new Error("Only pending orders can be cancelled.");
  }

  await prisma.$transaction(async (tx) => {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      select: { id: true, productId: true, variantId: true, quantity: true },
    });

    for (const item of orderItems) {
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

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });

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
  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new Error("Delivery address can only be changed while the order is in transit.");
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



