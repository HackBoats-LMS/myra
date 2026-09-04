"use server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { logAudit } from "@/lib/audit";
import { detectImageType } from "@/lib/storage/image-upload";
import { uploadImageObject, REVIEW_IMAGES_BUCKET } from "@/lib/storage/image-storage";

const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadReviewImage(file: File): Promise<{ path: string; previewUrl: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to add review photos.");
  }
  if (!file) {
    throw new Error("No file provided.");
  }
  if (file.size > REVIEW_IMAGE_MAX_BYTES) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  return uploadImageObject(REVIEW_IMAGES_BUCKET, file, detected.mime, detected.ext);
}

export async function submitReview(productId: string, rating: number, comment: string, images: string[] = []) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to submit a review.");
  }

  const userId = session.user.id;

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const cleanComment = (comment || "").trim();
  if (cleanComment.length > 2000) {
    throw new Error("Review comment must not exceed 2000 characters.");
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId, deletedAt: null },
    select: { slug: true }
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  // Validate that submitted images are from the user's own uploads.
  const REVIEW_IMAGES_PREFIX = "review-images/";
  const validImages = images
    .slice(0, 5)
    .filter((img) => typeof img === "string" && img.startsWith(REVIEW_IMAGES_PREFIX));

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
        comment: cleanComment || null,
        images: validImages,
      },
    });
  } else {
    // Create new review
    await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment: cleanComment || null,
        images: validImages,
      },
    });
  }

  revalidatePath(`/products/${product.slug}`, "layout");
  revalidateTag(CACHE_TAGS.reviews(productId));
}

export async function deleteReview(reviewId: string) {
  await verifyAdmin();

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true, user: true }
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  await prisma.review.delete({
    where: { id: reviewId }
  });

  await logAudit("review.delete", `Deleted review ${reviewId} for product ${review.productId}`);

  revalidatePath(`/admin/reviews`, "layout");
  revalidatePath(`/products/${review.product.slug}`, "layout");
}

export async function setReviewApproved(reviewId: string, isApproved: boolean) {
  await verifyAdmin();

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true, user: true },
  });
  if (!review) {
    throw new Error("Review not found.");
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved },
  });

  await logAudit("review.update", `${isApproved ? "Approved" : "Hidden"} review ${reviewId} for product ${review.productId}`);

  revalidatePath(`/admin/reviews`, "layout");
  revalidatePath(`/products/${review.product.slug}`, "layout");
  revalidateTag(CACHE_TAGS.reviews(review.productId));
}

export async function replyToReview(reviewId: string, reply: string) {
  await verifyAdmin();

  const cleanReply = (reply || "").trim();
  if (!cleanReply) {
    throw new Error("Reply cannot be empty.");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true, user: true },
  });
  if (!review) {
    throw new Error("Review not found.");
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { reply: cleanReply, repliedAt: new Date() },
  });

  await logAudit("review.reply", `Replied to review ${reviewId} for product ${review.productId}`);

  revalidatePath(`/admin/reviews`, "layout");
  revalidatePath(`/products/${review.product.slug}`, "layout");
  revalidateTag(CACHE_TAGS.reviews(review.productId));
}
