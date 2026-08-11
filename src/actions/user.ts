"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  
  const name = String(formData.get("name") || "").trim().substring(0, 100);
  const email = String(formData.get("email") || "").trim().substring(0, 100);
  const phoneNumber = String(formData.get("phoneNumber") || "").trim().substring(0, 20);
  const addressLine1 = String(formData.get("addressLine1") || "").trim().substring(0, 255);
  const city = String(formData.get("city") || "").trim().substring(0, 100);
  const state = String(formData.get("state") || "").trim().substring(0, 100);
  const postalCode = String(formData.get("postalCode") || "").trim().substring(0, 20);
  const country = String(formData.get("country") || "").trim().substring(0, 100);

  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  const canUpdatePhone = !existingUser?.phoneNumber;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      email: email || null,
      addressLine1: addressLine1 || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
      ...(canUpdatePhone && phoneNumber ? { phoneNumber } : {})
    }
  });

  revalidatePath("/account");
}

export async function changePassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
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

