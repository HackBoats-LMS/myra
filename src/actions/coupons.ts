"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";

export async function createCoupon(formData: FormData) {
  await verifyAdmin();

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const type = String(formData.get("discountType"));
  const value = parseFloat(formData.get("discountValue") as string);
  const minOrderAmount = parseFloat(formData.get("minOrderAmount") as string) || 0;
  
  const maxUsesStr = formData.get("maxUses") as string;
  const maxUses = maxUsesStr ? parseInt(maxUsesStr, 10) : null;
  
  const expiresAtStr = formData.get("expiresAt") as string;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  if (!code || code.length < 3 || code.length > 20) {
    throw new Error("Coupon code must be between 3 and 20 characters.");
  }
  if (type !== "PERCENTAGE" && type !== "FIXED") {
    throw new Error("Invalid discount type.");
  }
  if (isNaN(value) || value <= 0) {
    throw new Error("Discount value must be greater than 0.");
  }
  if (type === "PERCENTAGE" && value > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
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
      discountType: type as "FIXED" | "PERCENTAGE",
      discountValue: value,
      minOrderAmount,
      maxUses,
      expiresAt,
    }
  });

  await logAudit("coupon.create", "Coupon", coupon.id, { code, discountType: type, discountValue: value });

  revalidatePath("/admin/coupons");
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
