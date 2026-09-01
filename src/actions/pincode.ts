"use server";
import { prisma } from "@/lib/db/prisma";

export async function checkPincodeAvailability(code: string): Promise<{
  available: boolean;
  message: string;
}> {
  const trimmed = code.trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { available: false, message: "Please enter a valid 6-digit pincode." };
  }

  const pincode = await prisma.pincode.findUnique({ where: { code: trimmed } });

  if (!pincode || !pincode.isActive) {
    return {
      available: false,
      message: "Delivery is not available to this pincode yet.",
    };
  }

  const location = [pincode.city, pincode.state].filter(Boolean).join(", ");
  return {
    available: true,
    message: location ? `Great! Delivery is available in ${location}.` : "Great! Delivery is available to this pincode.",
  };
}

export async function isPincodeDeliverable(code: string): Promise<boolean> {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return false;
  const pincode = await prisma.pincode.findUnique({ where: { code: trimmed } });
  return Boolean(pincode && pincode.isActive);
}
