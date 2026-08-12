"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

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
      updateTag(CACHE_TAGS.wishlist(userId));
      return false; // Removed
    } else {
      await prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId }
      });
      updateTag(CACHE_TAGS.wishlist(userId));
      return true; // Added
    }
  }

  // Guest wishlist (cookie-based)
  const cookieStore = await cookies();
  const productIds = parseGuestWishlistCookie(cookieStore.get(GUEST_WISHLIST_COOKIE)?.value);
  const index = productIds.indexOf(productId);

  let added: boolean;
  if (index > -1) {
    productIds.splice(index, 1);
    added = false;
  } else {
    productIds.push(productId);
    added = true;
  }

  cookieStore.set(GUEST_WISHLIST_COOKIE, JSON.stringify(productIds), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return added;
}

export async function mergeGuestWishlist(userId: string, cookieValue: string | undefined) {
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

  updateTag(CACHE_TAGS.wishlist(userId));
}
