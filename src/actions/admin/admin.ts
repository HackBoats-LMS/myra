"use server"
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { verifyAdmin, verifyWorkerCapability } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { refundRazorpayPayment, razorpayConfigured } from "@/lib/integrations/razorpay";
import { detectImageType, processImageToWebP } from "@/lib/storage/image-upload";
import bcrypt from "bcryptjs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ParsedVariantRecord {
  id?: string;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  stockQuantity?: string | number;
  priceOffset?: string | number;
}

function parseVariantRecords(variantsStr: string | null): ParsedVariantRecord[] {
  if (!variantsStr) return [];
  const parsed: unknown = JSON.parse(variantsStr);
  if (!Array.isArray(parsed)) return [];
  return parsed as ParsedVariantRecord[];
}

function normalizeVariant(v: ParsedVariantRecord) {
  return {
    ...v,
    stockQuantity: parseInt(String(v.stockQuantity ?? 0), 10) || 0,
    priceOffset: parseFloat(String(v.priceOffset ?? 0)) || 0,
  };
}

import { z } from "zod";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-URL-safe chars
    .replace(/[\s_]+/g, "-")       // spaces/underscores -> hyphens
    .replace(/-+/g, "-")           // collapse duplicate hyphens
    .replace(/^-+|-+$/g, "");      // trim leading/trailing hyphens
}

// Ensures the slug is unique across products, appending a numeric suffix on collision
// so two products with the same name never share the same URL.
async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  const baseSlug = base || `product-${Date.now()}`;
  let slug = baseSlug;
  let i = 2;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || (excludeId && existing.id === excludeId)) return slug;
    slug = `${baseSlug}-${i}`;
    i++;
  }
}

// Generates a readable, unique product code like MYRA-0001 used as the product's
// stable reference across the app. `code` is @unique; on a concurrent-create
// collision the caller retries with the next number.
async function generateProductCode(): Promise<string> {
  const count = await prisma.product.count();
  let i = count + 1;
  for (;;) {
    const code = `MYRA-${String(i).padStart(4, "0")}`;
    const existing = await prisma.product.findUnique({ where: { code } });
    if (!existing) return code;
    i++;
  }
}

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  slug: z.string().max(150).optional(),
  description: z.string().max(2000, "Description is too long").optional(),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0).nullable().optional(),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  collectionId: z.string().optional(),
  productType: z.string().max(50).nullable().optional(),
  material: z.string().max(100).nullable().optional(),
  weight: z.string().max(50).nullable().optional(),
  videoUrl: z.string().max(500).nullable().optional(),
  images: z.array(z.string().url()).max(5, "Max 5 images allowed"),
  variants: z.array(z.object({
    sku: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    stockQuantity: z.number().int().min(0).default(0),
    priceOffset: z.number().default(0),
  })).optional()
});

function parseImagesField(formData: FormData): string[] {
  const raw = formData.get("images");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && Boolean(v));
  } catch {
    return [];
  }
}

export async function createProduct(formData: FormData) {
  await verifyWorkerCapability("inventory");

  let parsedVariants: ParsedVariantRecord[] = [];
  try {
    const variantsStr = formData.get("variants") as string;
    if (variantsStr) parsedVariants = parseVariantRecords(variantsStr);
  } catch {
    throw new Error("Invalid variants format");
  }

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: parseFloat(formData.get("price") as string),
    originalPrice: formData.get("originalPrice") ? parseFloat(formData.get("originalPrice") as string) : null,
    stockQuantity: parseInt(formData.get("stockQuantity") as string, 10),
    collectionId: formData.get("collectionId") ? String(formData.get("collectionId")).trim() : undefined,
    productType: String(formData.get("productType") || "").trim() || null,
    material: String(formData.get("material") || "").trim() || null,
    weight: String(formData.get("weight") || "").trim() || null,
    videoUrl: String(formData.get("videoUrl") || "").trim() || null,
    images: parseImagesField(formData),
    variants: parsedVariants.map(normalizeVariant)
  };

  const result = productSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const data = result.data;
  if (!data.slug) {
    data.slug = slugify(data.name) || `product-${Date.now()}`;
  }
  data.slug = await uniqueProductSlug(data.slug);

  // A variant's price is base price + offset. Negative offsets are valid (e.g.
  // a smaller size costs less), but the resulting variant price must stay
  // positive — a zero/negative price would let an item be given away.
  for (const v of data.variants || []) {
    if (data.price + v.priceOffset <= 0) {
      throw new Error(
        `Variant price cannot be zero or negative (base ₹${data.price} plus offset of ${v.priceOffset}).`
      );
    }
  }

  // Create with a retry loop: two concurrent creates can compute the same
  // product code before either inserts, and `code` is unique — so on a P2002
  // collision we simply retry, and `generateProductCode()` probes the DB again
  // to pick the next free code.
  let created;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      created = await prisma.product.create({
        data: {
          name: data.name,
          code: await generateProductCode(),
          slug: data.slug,
          description: data.description || "",
          price: data.price,
          originalPrice: data.originalPrice ?? null,
          stockQuantity: data.stockQuantity,
          collectionId: data.collectionId || null,
          productType: data.productType || null,
          material: data.material || null,
          weight: data.weight || null,
          videoUrl: data.videoUrl || null,
          images: data.images,
          variants: {
            create: data.variants?.map(v => ({
              sku: v.sku || null,
              size: v.size || null,
              color: v.color || null,
              stockQuantity: v.stockQuantity,
              priceOffset: v.priceOffset,
            })) || []
          }
        }
      });
      break;
    } catch (e) {
      const isCodeCollision = (e as { code?: string }).code === "P2002";
      if (!isCodeCollision || attempt === 19) throw e;
      // Retry with a fresh code on the next iteration.
    }
  }

  await logAudit("product.create", "Product", created!.id, { slug: data.slug });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
}

export async function updateProduct(id: string, formData: FormData) {
  await verifyWorkerCapability("inventory");

  const prev = await prisma.product.findUnique({
    where: { id },
    select: { stockQuantity: true, slug: true, images: true },
  });

  let parsedVariants: ParsedVariantRecord[] = [];
  try {
    const variantsStr = formData.get("variants") as string;
    if (variantsStr) parsedVariants = parseVariantRecords(variantsStr);
  } catch {
    throw new Error("Invalid variants format");
  }

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: parseFloat(formData.get("price") as string),
    originalPrice: formData.get("originalPrice") ? parseFloat(formData.get("originalPrice") as string) : null,
    stockQuantity: parseInt(formData.get("stockQuantity") as string, 10),
    collectionId: formData.get("collectionId") ? String(formData.get("collectionId")).trim() : undefined,
    productType: String(formData.get("productType") || "").trim() || null,
    material: String(formData.get("material") || "").trim() || null,
    weight: String(formData.get("weight") || "").trim() || null,
    videoUrl: String(formData.get("videoUrl") || "").trim() || null,
    images: parseImagesField(formData),
    variants: parsedVariants.map(normalizeVariant)
  };

  const result = productSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const data = result.data;
  if (!data.slug) {
    data.slug = slugify(data.name) || `product-${Date.now()}`;
  }
  data.slug = await uniqueProductSlug(data.slug, id);

  // A variant's price is base price + offset. Negative offsets are valid (e.g.
  // a smaller size costs less), but the resulting variant price must stay
  // positive — a zero/negative price would let an item be given away.
  for (const v of data.variants || []) {
    if (data.price + v.priceOffset <= 0) {
      throw new Error(
        `Variant price cannot be zero or negative (base ₹${data.price} plus offset of ${v.priceOffset}).`
      );
    }
  }

  // Images removed from the product are no longer referenced by any product
  // (each image path belongs to a single product). Delete them from storage so
  // they don't accumulate as orphaned objects. Best-effort, after the DB write.
  const removedImages = (prev?.images ?? []).filter((img) => !data.images.includes(img));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        price: data.price,
        originalPrice: data.originalPrice ?? null,
        stockQuantity: data.stockQuantity,
        collectionId: data.collectionId || null,
        productType: data.productType || null,
        material: data.material || null,
        weight: data.weight || null,
        videoUrl: data.videoUrl || null,
        images: data.images,
      }
    });

    const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
    const incomingIds = parsedVariants.map(v => v.id).filter(Boolean);
    
    // Delete variants that were removed
    const toDelete = existingVariants.filter(ev => !incomingIds.includes(ev.id));
    for (const v of toDelete) {
      try {
        await tx.productVariant.delete({ where: { id: v.id } });
      } catch {
        // Might fail if used in an order. In a real app we'd archive it.
      }
    }

    // Upsert variants
    for (let i = 0; i < (data.variants || []).length; i++) {
      const v = data.variants![i];
      const originalId = parsedVariants[i].id; // id is not in Zod schema to avoid complexity, so grab from original

      const vData = {
        size: v.size || null,
        color: v.color || null,
        sku: v.sku || null,
        stockQuantity: v.stockQuantity,
        priceOffset: v.priceOffset,
      };

      if (originalId && existingVariants.some(ev => ev.id === originalId)) {
        await tx.productVariant.update({ where: { id: originalId }, data: vData });
      } else {
        await tx.productVariant.create({ data: { ...vData, productId: id } });
      }
    }
  });

  // Clean up images that were removed from the product (best-effort; storage
  // failures are non-fatal so the product update always succeeds).
  if (removedImages.length > 0) {
    const { deleteImageObjects } = await import("@/lib/storage/image-storage");
    await deleteImageObjects("product-images", removedImages).catch(console.error);
  }

  await logAudit("product.update", "Product", id, { slug: data.slug });

  // If the product just went from out-of-stock to in-stock, notify subscribers.
  const wasOutOfStock = (prev?.stockQuantity ?? 0) <= 0;
  if (wasOutOfStock && data.stockQuantity > 0) {
    const { notifyStockSubscribers } = await import("@/actions/storefront/stock-alert");
    await notifyStockSubscribers(id);
  }

revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
  if (prev?.slug) updateTag(CACHE_TAGS.product(prev.slug));
  if (data.slug !== prev?.slug) updateTag(CACHE_TAGS.product(data.slug));
}

export async function deleteProduct(id: string) {
  await verifyWorkerCapability("inventory");

  const prev = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await logAudit("product.delete", "Product", id);

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
  if (prev?.slug) updateTag(CACHE_TAGS.product(prev.slug));
}

export async function restoreProduct(id: string) {
  await verifyWorkerCapability("inventory");

  const prev = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  await prisma.product.update({
    where: { id },
    data: { deletedAt: null }
  });

  await logAudit("product.restore", "Product", id);

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
  if (prev?.slug) updateTag(CACHE_TAGS.product(prev.slug));
}

export async function bulkDeleteProducts(ids: string[]) {
  await verifyWorkerCapability("inventory");

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date() }
  });

  await logAudit("product.bulkDelete", "Product", undefined, { ids });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
}

export async function bulkRestoreProducts(ids: string[]) {
  await verifyWorkerCapability("inventory");

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: null }
  });

  await logAudit("product.bulkRestore", "Product", undefined, { ids });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
}

export async function bulkUpdateStock(ids: string[], stockQuantity: number) {
  await verifyWorkerCapability("inventory");

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Select at least one product.");
  }
  if (ids.length > 200) {
    throw new Error("Cannot update more than 200 products at once.");
  }
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock must be a non-negative whole number.");
  }

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { stockQuantity }
  });

  await logAudit("product.bulkUpdateStock", "Product", undefined, { ids, stockQuantity });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
}

const collectionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  slug: z.string().max(150).optional(),
  description: z.string().max(500, "Description is too long").optional(),
  image: z.string().url().optional().nullable(),
});

export async function createCollection(formData: FormData) {
  await verifyWorkerCapability("inventory");

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    image: formData.get("image") ? String(formData.get("image")).trim() : null,
  };

  const result = collectionSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const { name, slug, description, image } = result.data;

  const resolvedSlug = slug || slugify(name) || `collection-${Date.now()}`;

  const existing = await prisma.collection.findUnique({ where: { slug: resolvedSlug } });
  if (existing) {
    throw new Error(`A collection with the slug "${resolvedSlug}" already exists.`);
  }

  const createdCollection = await prisma.collection.create({
    data: { name, slug: resolvedSlug, description: description || null, image: image || null }
  });

  await logAudit("collection.create", "Collection", createdCollection.id, { slug: resolvedSlug });

  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.collections);
  updateTag(CACHE_TAGS.workerCollections);
}

export async function updateCollection(id: string, formData: FormData) {
  await verifyWorkerCapability("inventory");

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    image: formData.get("image") ? String(formData.get("image")).trim() : null,
  };

  const result = collectionSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const { name, slug, description } = result.data;

  const resolvedSlug = slug || slugify(name) || `collection-${Date.now()}`;

  const existing = await prisma.collection.findUnique({ where: { slug: resolvedSlug } });
  if (existing && existing.id !== id) {
    throw new Error(`A collection with the slug "${resolvedSlug}" already exists.`);
  }

  await prisma.collection.update({
    where: { id },
    data: { name, slug: resolvedSlug, description: description || null }
  });

  await logAudit("collection.update", "Collection", id, { slug: resolvedSlug });

  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.collections);
  updateTag(CACHE_TAGS.workerCollections);
}

export async function deleteCollection(id: string) {
  await verifyWorkerCapability("inventory");

  await prisma.$transaction(async (tx) => {
    // Products reference this collection (FK Restrict). Reassign them to no
    // collection first so the delete doesn't crash on a DB constraint error.
    await tx.product.updateMany({
      where: { collectionId: id },
      data: { collectionId: null },
    });

    await tx.collection.delete({
      where: { id }
    });
  });

  await logAudit("collection.delete", "Collection", id);

  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.collections);
  updateTag(CACHE_TAGS.workerCollections);
}

export async function toggleBestSeller(productId: string, bestSeller: boolean) {
  await verifyWorkerCapability("inventory");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { bestSeller },
  });

  await logAudit("product.bestSellerUpdate", "Product", productId, { bestSeller });

  if (product.collectionId) {
    revalidatePath(`/admin/collections/${product.collectionId}`);
    revalidatePath(`/worker/collections/${product.collectionId}`);
  }
  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
}

const refundSchema = z.object({
  amount: z.number().min(0.01, "Refund amount must be greater than 0"),
  orderId: z.string().uuid("Invalid order ID"),
});

export async function processRefund(orderId: string, formData: FormData) {
  await verifyAdmin();

  const amountStr = formData.get("amount");
  const amount = amountStr ? parseFloat(amountStr as string) : 0;

  const result = refundSchema.safeParse({ amount, orderId });
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }

  const totalRefundable = order.totalAmount - (order.refundedAmount || 0);

  if (amount > totalRefundable) {
    throw new Error(`Cannot refund more than the remaining refundable amount (₹${totalRefundable.toFixed(2)})`);
  }

  const isOnlineRefund = order.paymentMethod === "RAZORPAY" && !!order.razorpayPaymentId;
  if (isOnlineRefund && !razorpayConfigured()) {
    throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to issue online refunds.");
  }

  const prevPaymentStatus = order.paymentStatus;

  // Atomic, concurrency-safe claim of the refund amount. Guards against two
  // simultaneous refunds collectively exceeding the remaining balance.
  const nextStatus = (order.refundedAmount || 0) + amount >= order.totalAmount ? "REFUNDED" : "PARTIALLY_REFUNDED";
  const refundResult = await prisma.order.updateMany({
    where: {
      id: orderId,
      refundedAmount: { lte: order.totalAmount - amount },
    },
    data: {
      refundedAmount: { increment: amount },
      paymentStatus: isOnlineRefund ? nextStatus : order.paymentStatus,
    },
  });
  if (refundResult.count === 0) {
    throw new Error("Refund could not be applied. The remaining refundable amount may have already been refunded.");
  }

  // Push the refund to the Razorpay gateway only after the DB claim succeeds.
  // If the money cannot be sent, revert the claim so DB and gateway stay consistent.
  try {
    if (isOnlineRefund) {
      await refundRazorpayPayment(order.razorpayPaymentId!, amount * 100);
    }
  } catch (err) {
    // Reconcile before rolling back: if the refund actually reached the gateway
    // (e.g. the request timed out after Razorpay processed it), keep the DB
    // claim so a retry cannot double-refund the customer.
    const { hasRefundSucceeded } = await import("@/lib/integrations/razorpay");
    const refunded = order.razorpayPaymentId
      ? await hasRefundSucceeded(order.razorpayPaymentId)
      : false;
    if (!refunded) {
      await prisma.order.updateMany({
        where: { id: orderId, refundedAmount: { gte: amount } },
        data: { refundedAmount: { decrement: amount }, paymentStatus: prevPaymentStatus },
      });
    }
    throw err;
  }

  await logAudit("order.refund", "Order", orderId, { amount });

  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function uploadImage(formData: FormData) {
  await verifyWorkerCapability("inventory");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided.");

  // Server-side file size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }

  // Sniff the actual content so a spoofed MIME/extension can't smuggle non-images.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  // Optimize the image (upscale-if-small, downscale-if-huge, re-encode to WebP)
  // so every uploaded product image is sharp and fast-loading. Animated GIFs
  // are returned untouched.
  const { data, mime, ext } = await processImageToWebP(bytes, detected);

  // Use crypto.randomUUID() — cryptographically strong, no Math.random()
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": mime,
    },
    body: new Blob([new Uint8Array(data)], { type: mime }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload: ${err}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
}

export async function toggleUserDisabled(userId: string, isDisabled: boolean) {
  await verifyAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { isDisabled }
  });

  await logAudit("user.toggleDisabled", "User", userId, { isDisabled });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
}

export async function updateCustomerProfile(
  userId: string,
  formData: FormData
) {
  await verifyAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phoneNumber = String(formData.get("phoneNumber") || "").trim() || null;

  if (!name) {
    throw new Error("Name cannot be empty.");
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new Error("User not found");
  }
  if (existingUser.role === "ADMIN") {
    throw new Error("Admin profiles cannot be edited here.");
  }

  if (email) {
    const emailConflict = await prisma.user.findFirst({
      where: { email, id: { not: userId } },
    });
    if (emailConflict) {
      throw new Error("This email address is already in use by another account.");
    }
  }
  if (phoneNumber) {
    const phoneConflict = await prisma.user.findFirst({
      where: { phoneNumber, id: { not: userId } },
    });
    if (phoneConflict) {
      throw new Error("This phone number is already in use by another account.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, email, phoneNumber },
  });

  await logAudit("user.updateProfile", "User", userId, { name, email, phoneNumber });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
}

export async function updateUserRole(userId: string, role: "CUSTOMER" | "DELIVERY" | "MULTI_WORKER") {
  await verifyAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.role === "ADMIN") {
    throw new Error("Admin roles cannot be changed.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAudit("user.roleUpdate", "User", userId, { role });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin");
}

export async function updateWorkerCapabilities(
  userId: string,
  capabilities: { inventory: boolean; shipping: boolean }
) {
  await verifyAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.role !== "MULTI_WORKER") {
    throw new Error("Capabilities can only be set for Multi-Worker accounts.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      canManageInventory: capabilities.inventory,
      canManageShipping: capabilities.shipping,
    },
  });

  await logAudit("user.capabilitiesUpdate", "User", userId, capabilities);

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
}

export async function createWorker(formData: FormData) {
  await verifyAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phoneNumber = String(formData.get("phoneNumber") || "").trim();
  const password = String(formData.get("password") || "");
  const inventory = formData.get("inventory") === "on";
  const shipping = formData.get("shipping") === "on";

  if (!name) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phoneNumber ? [{ phoneNumber }] : [])] },
  });
  if (existing) {
    throw new Error("A user with that email or phone already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phoneNumber: phoneNumber || null,
      password: hashedPassword,
      role: "MULTI_WORKER",
      canManageInventory: inventory,
      canManageShipping: shipping,
    },
  });

  await logAudit("user.workerCreate", "User", user.id, {
    name,
    email,
    canManageInventory: inventory,
    canManageShipping: shipping,
  });

  revalidatePath("/admin/workers");
  revalidatePath("/admin/customers");
}

export async function shipOrder(orderId: string) {
  await verifyWorkerCapability("shipping");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true } } },
  });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    throw new Error("Cannot ship a cancelled or delivered order.");
  }
  // Never ship an online (Razorpay) order that hasn't been paid — doing so
  // would let the goods go out COD and bypass the intended online payment.
  if (order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID") {
    throw new Error("Cannot ship an online order until its payment is captured.");
  }
  if (order.shipmentId) {
    throw new Error("This order has already been shipped to Shiprocket.");
  }

  const { createShipment, assignAwbAndSchedulePickup, shiprocketConfigured } = await import("@/lib/integrations/shiprocket");
  if (!shiprocketConfigured()) {
    throw new Error("Shiprocket is not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
  }

  const { shiprocketOrderId, shipmentId, awbCode, courierName } = await createShipment(orderId);

  let finalAwb = awbCode;
  let finalCourier = courierName;
  let trackingUrl = "";

  if (shipmentId && !finalAwb) {
    try {
      const pickup = await assignAwbAndSchedulePickup(shipmentId);
      finalAwb = pickup.awbCode;
      finalCourier = pickup.courierName || finalCourier;
      trackingUrl = pickup.trackingUrl;
    } catch {
      // AWB assignment can be async; creation succeeded, status will update via webhook.
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      shiprocketOrderId: shiprocketOrderId || null,
      shipmentId: shipmentId || null,
      awbNumber: finalAwb || null,
      courierName: finalCourier || null,
      trackingUrl: trackingUrl || null,
      status: finalAwb ? "SHIPPED" : "READY_TO_SHIP",
      ...(finalAwb ? { shippedAt: new Date() } : { readyToShipAt: new Date() }),
    },
  });

  await logAudit("order.ship", "Order", orderId, { shipmentId, awb: finalAwb });

  if (finalAwb && order.user?.email) {
    import("@/lib/email/email").then(({ sendOrderShippedEmail }) =>
      sendOrderShippedEmail(order.user.email!, orderId).catch(console.error)
    );
  }

  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/account/orders`);
  updateTag(CACHE_TAGS.workerOrders);
  updateTag(CACHE_TAGS.deliveryOrders);
}

export async function updateOrderInternalNotes(orderId: string, internalNotes: string) {
  await verifyAdmin();

  await prisma.order.update({
    where: { id: orderId },
    data: { internalNotes: internalNotes || null }
  });

  await logAudit("order.notesUpdate", "Order", orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function addPincode(formData: FormData) {
  await verifyAdmin();

  const code = String(formData.get("code") || "").trim();
  const city = String(formData.get("city") || "").trim() || null;
  const state = String(formData.get("state") || "").trim() || null;

  if (!/^\d{6}$/.test(code)) {
    throw new Error("Pincode must be a 6-digit number.");
  }

  const existing = await prisma.pincode.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`Pincode ${code} is already added.`);
  }

  await prisma.pincode.create({
    data: { code, city, state },
  });

  await logAudit("pincode.create", "Pincode", code, { code, city, state });

  revalidatePath("/admin/pincodes");
}

export async function deletePincode(id: string) {
  await verifyAdmin();

  const pincode = await prisma.pincode.delete({ where: { id } });

  await logAudit("pincode.delete", "Pincode", pincode.code);

  revalidatePath("/admin/pincodes");
}

export async function togglePincodeActive(id: string, isActive: boolean) {
  await verifyAdmin();

  await prisma.pincode.update({
    where: { id },
    data: { isActive },
  });

  await logAudit("pincode.toggle", "Pincode", id, { isActive });

  revalidatePath("/admin/pincodes");
}
