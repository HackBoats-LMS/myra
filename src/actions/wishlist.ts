"use server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { signCookieValue, verifyCookieValue } from "@/lib/cookie-signing";

const GUEST_WISHLIST_COOKIE = "guest_wishlist";
const MAX_GUEST_ITEMS = 100;

function parseGuestWishlistCookie(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, MAX_GUEST_ITEMS);
  } catch {
    return [];
  }
}

export async function toggleWishlist(productId: string) {
  // Validate that the product exists before toggling.
  const product = await prisma.product.findUnique({ where: { id: productId, deletedAt: null }, select: { id: true } });
  if (!product) {
    throw new Error("Product not found.");
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const userId = session.user.id;

    let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({ data: { userId } });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId }
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      revalidateTag(CACHE_TAGS.wishlist(userId));
      return false; // Removed
    } else {
      await prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId }
      });
      revalidateTag(CACHE_TAGS.wishlist(userId));
      return true; // Added
    }
  }

  // Guest wishlist (cookie-based)
  const cookieStore = await cookies();
  const rawWishlistData = verifyCookieValue(cookieStore.get(GUEST_WISHLIST_COOKIE)?.value);
  const productIds = parseGuestWishlistCookie(rawWishlistData ?? cookieStore.get(GUEST_WISHLIST_COOKIE)?.value);
  const index = productIds.indexOf(productId);

  let added: boolean;
  if (index > -1) {
    productIds.splice(index, 1);
    added = false;
  } else {
    productIds.push(productId);
    added = true;
  }

  cookieStore.set(GUEST_WISHLIST_COOKIE, signCookieValue(JSON.stringify(productIds)), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return added;
}

export async function mergeGuestWishlist(cookieValue: string | undefined) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in to merge wishlist.");
  }
  const userId = session.user.id;

  const productIds = parseGuestWishlistCookie(cookieValue);
  if (productIds.length === 0) return;

  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }

  const existing = await prisma.wishlistItem.findMany({
    where: {
      wishlistId: wishlist.id,
      productId: { in: productIds },
    },
    select: { productId: true },
  });
  const existingIds = new Set(existing.map((i) => i.productId));
  const toAdd = productIds.filter((id) => !existingIds.has(id));

  if (toAdd.length > 0) {
    await prisma.wishlistItem.createMany({
      data: toAdd.map((productId) => ({ wishlistId: wishlist.id, productId })),
    });
  }

  revalidateTag(CACHE_TAGS.wishlist(userId));
}

export type WishlistDrawerItem = {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    images?: string[] | null;
    collection?: { name: string | null } | null;
  };
};

export async function getWishlist(): Promise<WishlistDrawerItem[]> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  if (userId) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            product: { include: { collection: { select: { name: true } } } },
          },
        },
      },
    });
    return (
      wishlist?.items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
          collection: item.product.collection,
        },
      })) || []
    );
  }

  // Guest wishlist (cookie-based)
  const cookieStore = await cookies();
  const productIds = parseGuestWishlistCookie(cookieStore.get(GUEST_WISHLIST_COOKIE)?.value);
  if (productIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    include: { collection: { select: { name: true } } },
  });
  return products.map((p) => ({
    id: `guest-${p.id}`,
    product: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      images: p.images,
      collection: p.collection,
    },
  }));
}

export async function getWishlistCount(): Promise<number> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  if (userId) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { _count: { select: { items: true } } },
    });
    return wishlist?._count.items ?? 0;
  }

  const cookieStore = await cookies();
  return parseGuestWishlistCookie(cookieStore.get(GUEST_WISHLIST_COOKIE)?.value).length;
}
