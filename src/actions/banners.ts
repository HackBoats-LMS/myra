"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS, revalidateTag } from "@/lib/cache";
import { z } from "zod";

const bannerSchema = z.object({
  slot: z.string().min(1).max(50),
  imageUrl: z
    .string()
    .min(1, "Image is required")
    .max(1000)
    .refine(
      (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("blob:"),
      { message: "Image URL must be a valid path or URL" }
    ),
  linkUrl: z
    .string()
    .max(500)
    .refine(
      (val) =>
        !val ||
        val.trim() === "" ||
        val.startsWith("/") ||
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("#") ||
        val.startsWith("mailto:") ||
        val.startsWith("tel:"),
      { message: "Link URL must be a valid URL (https://...) or relative path (e.g. /collections/sarees)" }
    )
    .transform((val) => (val && val.trim() !== "" ? val.trim() : null))
    .nullable()
    .optional(),
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(300).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  altText: z.string().max(100).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function getBannersAdmin() {
  await verifyAdmin();
  return prisma.banner.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function upsertBanner(data: {
  slot: string;
  imageUrl: string;
  linkUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  altText?: string | null;
  isActive?: boolean;
}) {
  await verifyAdmin();
  const parsed = bannerSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || "Invalid banner data");
  }
  const validated = parsed.data;

  const banner = await prisma.banner.upsert({
    where: { slot: validated.slot },
    create: {
      slot: validated.slot,
      imageUrl: validated.imageUrl,
      linkUrl: validated.linkUrl || null,
      title: validated.title || null,
      subtitle: validated.subtitle || null,
      description: validated.description || null,
      altText: validated.altText || null,
      isActive: validated.isActive ?? true,
    },
    update: {
      imageUrl: validated.imageUrl,
      linkUrl: validated.linkUrl || null,
      title: validated.title || null,
      subtitle: validated.subtitle || null,
      description: validated.description || null,
      altText: validated.altText || null,
      isActive: validated.isActive ?? true,
    },
  });

  await logAudit("banner.upsert", "Banner", banner.id, { slot: validated.slot });

  try {
    revalidateTag(CACHE_TAGS.banners);
    revalidateTag(CACHE_TAGS.brandStories);
  } catch (e) {
    console.warn("[banners] revalidateTag error:", e);
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners", "layout");

  return banner;
}

export async function deleteBanner(slot: string) {
  await verifyAdmin();

  const existing = await prisma.banner.findUnique({ where: { slot } });
  if (existing) {
    await prisma.banner.delete({ where: { slot } });
    await logAudit("banner.delete", "Banner", existing.id, { slot });
    
    if (existing.imageUrl) {
      const { deleteMediaFromStorage } = await import("@/actions/admin");
      await deleteMediaFromStorage([existing.imageUrl]);
    }
  }

  try {
    revalidateTag(CACHE_TAGS.banners);
    revalidateTag(CACHE_TAGS.brandStories);
  } catch (e) {
    console.warn("[banners] revalidateTag error:", e);
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners", "layout");

  return { success: true };
}
