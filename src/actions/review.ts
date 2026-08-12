"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitReview(productId: string, rating: number, comment: string) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to submit a review.");
  }

  const userId = session.user.id;

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true }
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  // Check if user has already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (existingReview) {
    // Update existing review
    await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment: comment.trim() || null,
      },
    });
  } else {
    // Create new review
    await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment: comment.trim() || null,
      },
    });
  }

  revalidatePath(`/products/${product.slug}`);
}

export async function deleteReview(reviewId: string) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true }
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  await prisma.review.delete({
    where: { id: reviewId }
  });

  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products/${review.product.slug}`);
}
