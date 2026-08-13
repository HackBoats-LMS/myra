"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/auth-utils";

import { z } from "zod";

const userProfileSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").max(100).optional().nullable(),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().nullable(),
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

  const canUpdatePhone = !existingUser?.phoneNumber;

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
      ...(canUpdatePhone && data.phoneNumber ? { phoneNumber: data.phoneNumber } : {})
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

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" }
  });

  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
}

export async function deleteUserAccount() {
  const userId = await verifyUser();

  await prisma.$transaction(async (tx) => {
    // Delete addresses
    await tx.address.deleteMany({ where: { userId } });

    // Delete reviews
    await tx.review.deleteMany({ where: { userId } });

    // Delete cart
    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    }

    // Delete wishlist
    const wishlist = await tx.wishlist.findUnique({ where: { userId } });
    if (wishlist) {
      await tx.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
      await tx.wishlist.delete({ where: { id: wishlist.id } });
    }

    // Anonymize User record to satisfy foreign key constraints of Order history
    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Deleted Account",
        email: `deleted-${userId}@myra.com`, // Unique dummy to prevent conflicts
        phoneNumber: null,
        password: null,
        addressLine1: null,
        city: null,
        state: null,
        postalCode: null,
        country: null,
      }
    });
  });
}

