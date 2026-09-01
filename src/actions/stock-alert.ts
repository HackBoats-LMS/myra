"use server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeStockAlert(productId: string, email: string) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, deletedAt: null },
    select: { id: true, name: true, slug: true, stockQuantity: true },
  });
  if (!product) {
    throw new Error("Product not found.");
  }
  if (product.stockQuantity > 0) {
    throw new Error("This product is already in stock.");
  }

  // Light anti-spam: limit signups per email.
  try {
    await checkRateLimit({ bucket: "stockalert:email", key: cleanEmail, limit: 5, windowSeconds: 300 });
  } catch (error) {
    if (error instanceof RateLimitError) throw new Error("Too many signups. Please try again later.");
    throw error;
  }

  await prisma.stockNotification.upsert({
    where: { productId_email: { productId, email: cleanEmail } },
    create: { productId, email: cleanEmail },
    update: {},
  });

  return { ok: true };
}

/**
 * Notify all pending subscribers whose product is now in stock.
 * Marks them as sent to avoid duplicate emails. Called from the admin inventory update
 * and from the stock-alerts cron route.
 */
export async function notifyStockSubscribers(productId: string) {
  // Require admin or inventory-worker auth to prevent abuse
  const { verifyWorkerCapability } = await import("@/lib/auth/auth-utils");
  await verifyWorkerCapability("inventory");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true, stockQuantity: true },
  });
  if (!product || product.stockQuantity <= 0) return { notified: 0 };

  const pending = await prisma.stockNotification.findMany({
    where: { productId, sentAt: null },
  });
  if (pending.length === 0) return { notified: 0 };

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/products/${product.slug}`;
  const { sendStockBackInStockEmail } = await import("@/lib/email/email");

  let notified = 0;
  for (const sub of pending) {
    try {
      await sendStockBackInStockEmail(sub.email, product.name, productUrl);
      await prisma.stockNotification.update({ where: { id: sub.id }, data: { sentAt: new Date() } });
      notified += 1;
    } catch (err) {
      console.error("Stock alert email failed for", sub.email, err);
    }
  }

  revalidatePath(`/products/${product.slug}`);
  return { notified };
}
