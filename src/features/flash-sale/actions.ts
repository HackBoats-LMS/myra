"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { verifyWorkerCapability } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";
import { FLASH_SALE_TAG } from "@/features/flash-sale/lib";

export async function createFlashSale(input: {
  title: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  startAt: string;
  endAt: string;
  collectionId?: string;
  isActive: boolean;
}) {
  await verifyWorkerCapability("inventory");

  const title = (input.title || "").trim();
  if (!title) throw new Error("Title is required.");
  if (!input.value || input.value <= 0) throw new Error("Discount value must be greater than 0.");
  if (input.discountType === "PERCENTAGE" && input.value > 100) throw new Error("Percentage discount cannot exceed 100.");
  if (input.discountType === "FIXED" && input.value < 0) throw new Error("Fixed discount cannot be negative.");

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) throw new Error("Invalid start/end time.");
  if (endAt <= startAt) throw new Error("End time must be after start time.");

  await prisma.flashSale.create({
    data: {
      title,
      discountType: input.discountType,
      value: input.value,
      startAt,
      endAt,
      collectionId: input.collectionId || null,
      isActive: input.isActive,
    },
  });

  await logAudit("flashsale.create", `Created flash sale "${title}"`);
  revalidatePath("/admin/flash-sales");
  updateTag(FLASH_SALE_TAG);
  revalidatePath("/");
  revalidatePath("/collections");
  revalidatePath("/search");
}

export async function updateFlashSale(id: string, input: {
  title: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  startAt: string;
  endAt: string;
  collectionId?: string;
  isActive: boolean;
}) {
  await verifyWorkerCapability("inventory");

  const title = (input.title || "").trim();
  if (!title) throw new Error("Title is required.");
  if (!input.value || input.value <= 0) throw new Error("Discount value must be greater than 0.");
  if (input.discountType === "PERCENTAGE" && input.value > 100) throw new Error("Percentage discount cannot exceed 100.");
  if (input.discountType === "FIXED" && input.value < 0) throw new Error("Fixed discount cannot be negative.");

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) throw new Error("Invalid start/end time.");
  if (endAt <= startAt) throw new Error("End time must be after start time.");

  await prisma.flashSale.update({
    where: { id },
    data: {
      title,
      discountType: input.discountType,
      value: input.value,
      startAt,
      endAt,
      collectionId: input.collectionId || null,
      isActive: input.isActive,
    },
  });

  await logAudit("flashsale.update", `Updated flash sale "${title}"`);
  revalidatePath("/admin/flash-sales");
  updateTag(FLASH_SALE_TAG);
  revalidatePath("/");
}

export async function deleteFlashSale(id: string) {
  await verifyWorkerCapability("inventory");
  await prisma.flashSale.delete({ where: { id } });
  await logAudit("flashsale.delete", `Deleted flash sale`);
  revalidatePath("/admin/flash-sales");
  updateTag(FLASH_SALE_TAG);
  revalidatePath("/");
}