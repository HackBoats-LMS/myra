"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { verifyAdmin } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";

export async function addReview(productId: string, rating: number, comment: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("You must be logged in to leave a review.");
  }
  
  const userId = session.user.id;

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }

  // Prevent multiple reviews from the same user for the same product
  const existingReview = await prisma.review.findFirst({
    where: { userId, productId }
  });

  if (existingReview) {
    throw new Error("You have already reviewed this product.");
  }

  await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment: comment.trim() || null
    }
  });

  revalidatePath(`/products/${productId}`);
  updateTag(CACHE_TAGS.reviews(productId));
  updateTag(CACHE_TAGS.products);
}

export async function deleteReview(reviewId: string) {
  await verifyAdmin();

  // First get the review to know the productId for cache revalidation
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { productId: true } });
  
  await prisma.review.delete({
    where: { id: reviewId }
  });

  await logAudit("review.delete", "Review", reviewId, review?.productId ? { productId: review.productId } : undefined);

  if (review?.productId) {
    revalidatePath(`/products/${review.productId}`);
    updateTag(CACHE_TAGS.reviews(review.productId));
    updateTag(CACHE_TAGS.products);
  } else {
    revalidatePath("/admin/reviews");
    revalidatePath(`/products`);
  }
}
