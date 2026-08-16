"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth-utils";
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
  if (isNaN(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    throw new Error("Tax percentage must be between 0 and 100.");
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
