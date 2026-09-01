"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";

export async function updateStoreSettings(formData: FormData) {
  await verifyAdmin();

  const storeName = String(formData.get("storeName") || "").trim();
  const supportEmail = String(formData.get("supportEmail") || "").trim();
  const supportPhone = String(formData.get("supportPhone") || "").trim();
  const footerAbout = String(formData.get("footerAbout") || "").trim();
  const taxPercent = parseFloat(formData.get("taxPercent") as string) || 0;
  const promoEnabled = formData.get("promoEnabled") === "on";
  const promoText = String(formData.get("promoText") || "").trim();
  const promoLink = String(formData.get("promoLink") || "").trim();

  if (!storeName) {
    throw new Error("Store name cannot be empty.");
  }
  if (storeName.length > 100) {
    throw new Error("Store name must not exceed 100 characters.");
  }
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    throw new Error("Invalid support email address format.");
  }
  if (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    throw new Error("Tax percentage must be between 0 and 100.");
  }
  if (promoText.length > 500) {
    throw new Error("Promo text must not exceed 500 characters.");
  }
  if (promoLink.length > 500) {
    throw new Error("Promo link must not exceed 500 characters.");
  }
  if (promoLink) {
    try {
      const parsed = new URL(promoLink, "https://placeholder.local");
      if (/^(javascript|data|vbscript):/i.test(parsed.protocol)) {
        throw new Error("Promo link contains a disallowed URL scheme.");
      }
    } catch {
      if (promoLink.startsWith("//") || /^(javascript|data|vbscript):/i.test(promoLink)) {
        throw new Error("Promo link contains a disallowed URL scheme.");
      }
    }
  }
  if (footerAbout.length > 1000) {
    throw new Error("Footer text must not exceed 1000 characters.");
  }

  const values: Record<string, string> = {
    storeName,
    supportEmail,
    supportPhone,
    footerAbout,
    taxPercent: String(taxPercent),
    promoEnabled: promoEnabled ? "true" : "false",
    promoText,
    promoLink,
  };

  for (const [key, value] of Object.entries(values)) {
    await prisma.storeSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  await logAudit("settings.update", "StoreSetting", "global", values);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
