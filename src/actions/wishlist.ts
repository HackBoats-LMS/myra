"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function toggleWishlist(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Must be logged in to wishlist.");

  const userId = session.user.id;

  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } }
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return false; // Removed
  } else {
    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId }
    });
    return true; // Added
  }
}
