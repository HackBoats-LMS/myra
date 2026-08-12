"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/auth-utils";

export async function createAddress(formData: FormData) {
  const userId = await verifyUser();

  const label = String(formData.get("label") || "").trim().substring(0, 50);
  const addressLine1 = String(formData.get("addressLine1") || "").trim().substring(0, 255);
  const city = String(formData.get("city") || "").trim().substring(0, 100);
  const state = String(formData.get("state") || "").trim().substring(0, 100);
  const postalCode = String(formData.get("postalCode") || "").trim().substring(0, 20);
  const country = String(formData.get("country") || "").trim().substring(0, 100);
  const isDefaultInput = formData.get("isDefault") === "true";

  if (!label || !addressLine1 || !city || !state || !postalCode || !country) {
    throw new Error("All address fields are required.");
  }

  await prisma.$transaction(async (tx) => {
    // Count user's existing addresses
    const count = await tx.address.count({ where: { userId } });
    
    // Determine if this should be default
    const shouldBeDefault = count === 0 ? true : isDefaultInput;

    if (shouldBeDefault) {
      // Clear existing default
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    await tx.address.create({
      data: {
        userId,
        label,
        addressLine1,
        city,
        state,
        postalCode,
        country,
        isDefault: shouldBeDefault
      }
    });
  });

  revalidatePath("/account");
}

export async function updateAddress(addressId: string, formData: FormData) {
  const userId = await verifyUser();

  const label = String(formData.get("label") || "").trim().substring(0, 50);
  const addressLine1 = String(formData.get("addressLine1") || "").trim().substring(0, 255);
  const city = String(formData.get("city") || "").trim().substring(0, 100);
  const state = String(formData.get("state") || "").trim().substring(0, 100);
  const postalCode = String(formData.get("postalCode") || "").trim().substring(0, 20);
  const country = String(formData.get("country") || "").trim().substring(0, 100);
  const isDefaultInput = formData.get("isDefault") === "true";

  if (!label || !addressLine1 || !city || !state || !postalCode || !country) {
    throw new Error("All address fields are required.");
  }

  // Verify ownership
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new Error("Address not found.");
  }

  await prisma.$transaction(async (tx) => {
    if (isDefaultInput && !address.isDefault) {
      // Clear other defaults
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    await tx.address.update({
      where: { id: addressId },
      data: {
        label,
        addressLine1,
        city,
        state,
        postalCode,
        country,
        isDefault: address.isDefault ? true : isDefaultInput // Once default, remains default
      }
    });
  });

  revalidatePath("/account");
}

export async function deleteAddress(addressId: string) {
  const userId = await verifyUser();

  // Verify ownership
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new Error("Address not found.");
  }

  await prisma.$transaction(async (tx) => {
    // Delete address
    await tx.address.delete({ where: { id: addressId } });

    // If it was default, promote another address to default
    if (address.isDefault) {
      const another = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });
      if (another) {
        await tx.address.update({
          where: { id: another.id },
          data: { isDefault: true }
        });
      }
    }
  });

  revalidatePath("/account");
}

export async function setDefaultAddress(addressId: string) {
  const userId = await verifyUser();

  // Verify ownership
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) {
    throw new Error("Address not found.");
  }

  await prisma.$transaction(async (tx) => {
    // Set all other default address flags to false
    await tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });

    // Set target address to default
    await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true }
    });
  });

  revalidatePath("/account");
}
