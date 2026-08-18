"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";

export async function createCoupon(formData: FormData) {
  await verifyAdmin();

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const type = String(formData.get("discountType"));
  const value = parseFloat(formData.get("discountValue") as string);
  const minOrderAmount = parseFloat(formData.get("minOrderAmount") as string) || 0;
  
  const couponTypeStr = String(formData.get("type") || "STANDARD");
  const COUPON_TYPES = ["STANDARD", "FIRST_ORDER", "SINGLE_USE", "FESTIVAL", "SHIPPING"] as const;
  const couponType = (COUPON_TYPES as readonly string[]).includes(couponTypeStr) ? couponTypeStr : "STANDARD";
  const description = String(formData.get("description") || "").trim() || null;

  const maxUsesStr = formData.get("maxUses") as string;
  const maxUses = maxUsesStr ? parseInt(maxUsesStr, 10) : null;
  
  const maxUsesPerUserStr = formData.get("maxUsesPerUser") as string;
  const maxUsesPerUser = maxUsesPerUserStr ? parseInt(maxUsesPerUserStr, 10) : null;
  
  const expiresAtStr = formData.get("expiresAt") as string;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  if (!code || code.length < 3 || code.length > 20) {
    throw new Error("Coupon code must be between 3 and 20 characters.");
  }
  if (type !== "PERCENTAGE" && type !== "FIXED") {
    throw new Error("Invalid discount type.");
  }
  if (description && description.length > 120) {
    throw new Error("Description cannot exceed 120 characters.");
  }
  if (couponType !== "SHIPPING" && (isNaN(value) || value <= 0)) {
    throw new Error("Discount value must be greater than 0.");
  }
  if (couponType === "SHIPPING" && (isNaN(value) || value < 0)) {
    throw new Error("Shipping discount value cannot be negative.");
  }
  if (type === "PERCENTAGE" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }
  if (couponType === "SINGLE_USE") {
    if (!maxUsesPerUser || maxUsesPerUser !== 1) {
      throw new Error("Single-use coupons must have a per-user limit of 1.");
    }
  }

  // Check if code already exists
  const existing = await prisma.coupon.findUnique({
    where: { code }
  });

  if (existing) {
    throw new Error("A coupon with this code already exists.");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: couponType as "STANDARD" | "FIRST_ORDER" | "SINGLE_USE" | "FESTIVAL" | "SHIPPING",
      description,
      discountType: type as "FIXED" | "PERCENTAGE",
      discountValue: value,
      minOrderAmount,
      maxUses,
      maxUsesPerUser,
      expiresAt,
    }
  });

  await logAudit("coupon.create", "Coupon", coupon.id, { code, type: couponType, discountType: type, discountValue: value });

  revalidatePath("/admin/coupons");
}

export async function updateCoupon(id: string, formData: FormData) {
  await verifyAdmin();

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const type = String(formData.get("discountType"));
  const value = parseFloat(formData.get("discountValue") as string);
  const minOrderAmount = parseFloat(formData.get("minOrderAmount") as string) || 0;

  const couponTypeStr = String(formData.get("type") || "STANDARD");
  const COUPON_TYPES = ["STANDARD", "FIRST_ORDER", "SINGLE_USE", "FESTIVAL", "SHIPPING"] as const;
  const couponType = (COUPON_TYPES as readonly string[]).includes(couponTypeStr) ? couponTypeStr : "STANDARD";
  const description = String(formData.get("description") || "").trim() || null;

  const maxUsesStr = formData.get("maxUses") as string;
  const maxUses = maxUsesStr ? parseInt(maxUsesStr, 10) : null;

  const maxUsesPerUserStr = formData.get("maxUsesPerUser") as string;
  const maxUsesPerUser = maxUsesPerUserStr ? parseInt(maxUsesPerUserStr, 10) : null;

  const expiresAtStr = formData.get("expiresAt") as string;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  if (!code || code.length < 3 || code.length > 20) {
    throw new Error("Coupon code must be between 3 and 20 characters.");
  }
  if (type !== "PERCENTAGE" && type !== "FIXED") {
    throw new Error("Invalid discount type.");
  }
  if (description && description.length > 120) {
    throw new Error("Description cannot exceed 120 characters.");
  }
  if (couponType !== "SHIPPING" && (isNaN(value) || value <= 0)) {
    throw new Error("Discount value must be greater than 0.");
  }
  if (couponType === "SHIPPING" && (isNaN(value) || value < 0)) {
    throw new Error("Shipping discount value cannot be negative.");
  }
  if (type === "PERCENTAGE" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }
  if (couponType === "SINGLE_USE") {
    if (!maxUsesPerUser || maxUsesPerUser !== 1) {
      throw new Error("Single-use coupons must have a per-user limit of 1.");
    }
  }

  const existing = await prisma.coupon.findFirst({
    where: { code, id: { not: id } },
  });
  if (existing) {
    throw new Error("A coupon with this code already exists.");
  }

  await prisma.coupon.update({
    where: { id },
    data: {
      code,
      type: couponType as "STANDARD" | "FIRST_ORDER" | "SINGLE_USE" | "FESTIVAL" | "SHIPPING",
      description,
      discountType: type as "FIXED" | "PERCENTAGE",
      discountValue: value,
      minOrderAmount,
      maxUses,
      maxUsesPerUser,
      expiresAt,
    },
  });

  await logAudit("coupon.update", "Coupon", id, { code, type: couponType, discountType: type, discountValue: value });

  revalidatePath("/admin/coupons");
  revalidatePath(`/admin/coupons/${id}`);
}

export async function updateShippingConfig(formData: FormData) {
  await verifyAdmin();

  const flatRate = parseFloat(formData.get("flatRate") as string);
  const freeShippingThreshold = parseFloat(formData.get("freeShippingThreshold") as string);

  if (isNaN(flatRate) || flatRate < 0) {
    throw new Error("Flat shipping rate must be a non-negative number.");
  }
  if (isNaN(freeShippingThreshold) || freeShippingThreshold < 0) {
    throw new Error("Free shipping threshold must be a non-negative number.");
  }

  await prisma.shippingConfig.upsert({
    where: { id: "global" },
    create: { id: "global", flatRate, freeShippingThreshold },
    update: { flatRate, freeShippingThreshold },
  });

  await logAudit("shipping.update", "ShippingConfig", "global", { flatRate, freeShippingThreshold });

  revalidatePath("/admin/shipping");
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  await verifyAdmin();

  await prisma.coupon.update({
    where: { id },
    data: { isActive }
  });

  await logAudit("coupon.toggleStatus", "Coupon", id, { isActive });

  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string) {
  await verifyAdmin();

  await prisma.coupon.delete({
    where: { id }
  });

  await logAudit("coupon.delete", "Coupon", id);

  revalidatePath("/admin/coupons");
}
