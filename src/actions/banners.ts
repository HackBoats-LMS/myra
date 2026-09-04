"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { z } from "zod";

const bannerSchema = z.object({
  slot: z.string().min(1).max(50),
  imageUrl: z.string().url("Image URL must be a valid URL").min(1, "Image is required"),
  linkUrl: z.string().url("Link URL must be a valid URL").max(300).nullable().optional(),
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
  const validated = bannerSchema.parse(data);

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

  updateTag(CACHE_TAGS.banners);
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
  }

  updateTag(CACHE_TAGS.banners);
  revalidatePath("/", "layout");
  revalidatePath("/admin/banners", "layout");

  return { success: true };
}
