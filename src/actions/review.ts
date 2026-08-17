"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { logAudit } from "@/lib/audit";
import { detectImageType } from "@/lib/image-upload";
import { uploadImageObject, REVIEW_IMAGES_BUCKET } from "@/lib/image-storage";
import { verifyAdmin } from "@/lib/auth-utils";
import { checkRateLimit } from "@/lib/rate-limit";

const REVIEW_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function uploadReviewImage(file: File): Promise<{ path: string; previewUrl: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to add review photos.");
  }
  // Limit how many review images a single user can upload in a short window to
  // prevent storage abuse.
  await checkRateLimit({
    bucket: "upload:review",
    key: session.user.id,
    limit: 30,
    windowSeconds: 3600,
  });
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

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId, deletedAt: null },
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
        images: images.slice(0, 5),
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
        images: images.slice(0, 5),
      },
    });
  }

  revalidatePath(`/products/${product.slug}`);
  updateTag(CACHE_TAGS.reviews(productId));
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

  await logAudit("review.delete", `Deleted review by ${review.user?.name || "user"}`);

  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products/${review.product.slug}`);
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

  await logAudit("review.update", `${isApproved ? "Approved" : "Hidden"} review by ${review.user?.name || "user"}`);

  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products/${review.product.slug}`);
  updateTag(CACHE_TAGS.reviews(review.productId));
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

  await logAudit("review.reply", `Replied to review by ${review.user?.name || "user"}`);

  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products/${review.product.slug}`);
  updateTag(CACHE_TAGS.reviews(review.productId));
}
