"use server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { z } from "zod";

const brandStorySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().max(300).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().min(1, "Image is required"),
  linkUrl: z.string().max(300).nullable().optional(),
  altText: z.string().max(100).nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const DEFAULT_INITIAL_STORIES = [
  {
    title: "Curated for Every Celebration",
    subtitle: "Where Every Saree Becomes a Statement",
    description:
      "Discover a thoughtfully curated collection of silk, designer, and everyday sarees, along with elegant women's wear for every occasion. At Myra Shopping Mall, quality, craftsmanship, and timeless style come together to help you celebrate life's most beautiful moments.",
    imageUrl: "/displaypics/brandIdentity/1.png",
    linkUrl: "/collections/sarees",
    sortOrder: 0,
    isActive: true,
  },
  {
    title: "Fashion That Defines You",
    subtitle: "Style Beyond Trends",
    description:
      "Discover contemporary women's wear designed for confidence, comfort, and effortless style. From casual essentials to statement pieces, Myra Shopping Mall brings you the latest collections for every occasion.",
    imageUrl: "/displaypics/brandIdentity/2.png",
    linkUrl: "/collections/women",
    sortOrder: 1,
    isActive: true,
  },
];

export async function getBrandStoriesAdmin() {
  await verifyAdmin();

  let stories = await prisma.brandStory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  if (stories.length === 0) {
    // Auto-seed the 2 default stories into the database so they appear in admin immediately
    await prisma.brandStory.createMany({
      data: DEFAULT_INITIAL_STORIES,
    });
    stories = await prisma.brandStory.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  return stories;
}

export async function createBrandStory(data: {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  await verifyAdmin();
  const validated = brandStorySchema.parse(data);

  // If sortOrder wasn't explicitly provided, place it at the end
  let sortOrder = validated.sortOrder;
  if (sortOrder === 0) {
    const highest = await prisma.brandStory.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    sortOrder = (highest?.sortOrder ?? -1) + 1;
  }

  const story = await prisma.brandStory.create({
    data: {
      title: validated.title,
      subtitle: validated.subtitle || null,
      description: validated.description || null,
      imageUrl: validated.imageUrl,
      linkUrl: validated.linkUrl || null,
      altText: validated.altText || null,
      sortOrder,
      isActive: validated.isActive ?? true,
    },
  });

  await logAudit("brandStory.create", "BrandStory", story.id, { title: story.title });

  // Invalidate Next.js cache
  updateTag(CACHE_TAGS.brandStories);
  revalidatePath("/");
  revalidatePath("/admin/brand-stories");

  return story;
}

export async function updateBrandStory(
  id: string,
  data: {
    title: string;
    subtitle?: string | null;
    description?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    altText?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  await verifyAdmin();
  const validated = brandStorySchema.parse(data);

  const story = await prisma.brandStory.update({
    where: { id },
    data: {
      title: validated.title,
      subtitle: validated.subtitle || null,
      description: validated.description || null,
      imageUrl: validated.imageUrl,
      linkUrl: validated.linkUrl || null,
      altText: validated.altText || null,
      sortOrder: validated.sortOrder,
      isActive: validated.isActive ?? true,
    },
  });

  await logAudit("brandStory.update", "BrandStory", story.id, { title: story.title });

  // Invalidate Next.js cache
  updateTag(CACHE_TAGS.brandStories);
  revalidatePath("/");
  revalidatePath("/admin/brand-stories");

  return story;
}

export async function deleteBrandStory(id: string) {
  await verifyAdmin();

  const existing = await prisma.brandStory.findUnique({ where: { id } });
  if (existing) {
    await prisma.brandStory.delete({ where: { id } });
    await logAudit("brandStory.delete", "BrandStory", existing.id, { title: existing.title });
  }

  // Invalidate Next.js cache
  updateTag(CACHE_TAGS.brandStories);
  revalidatePath("/");
  revalidatePath("/admin/brand-stories");

  return { success: true };
}

export async function toggleBrandStoryActive(id: string, isActive: boolean) {
  await verifyAdmin();

  const story = await prisma.brandStory.update({
    where: { id },
    data: { isActive },
  });

  await logAudit("brandStory.toggleActive", "BrandStory", story.id, { isActive });

  updateTag(CACHE_TAGS.brandStories);
  revalidatePath("/");
  revalidatePath("/admin/brand-stories");

  return story;
}

export async function reorderBrandStories(orderedIds: string[]) {
  await verifyAdmin();

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.brandStory.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  await logAudit("brandStory.reorder", "BrandStory", "batch", { count: orderedIds.length });

  updateTag(CACHE_TAGS.brandStories);
  revalidatePath("/");
  revalidatePath("/admin/brand-stories");

  return { success: true };
}
