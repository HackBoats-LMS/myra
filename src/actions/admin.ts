"use server"
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { verifyAdmin, verifyWorkerCapability } from "@/lib/auth/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { refundRazorpayPayment, razorpayConfigured } from "@/lib/integrations/razorpay";
import { detectImageType } from "@/lib/storage/image-upload";
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
// stable reference across the app.
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
  price: z.number().min(0.01, "Price must be greater than 0").max(9999999, "Price is too high"),
  originalPrice: z.number().min(0).max(9999999).nullable().optional(),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  collectionId: z.string().optional(),
  bestSeller: z.boolean().default(false),
  productType: z.string().max(50).nullable().optional(),
  attributes: z.any().optional(),
  material: z.string().max(100).nullable().optional(),
  weight: z.string().max(50).nullable().optional(),
  videoUrl: z.string().url("Video URL must be a valid URL").max(500).nullable().optional(),
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

function parseAttributesField(formData: FormData): Record<string, unknown> {
  const raw = formData.get("attributes");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) {
      const obj: Record<string, string> = {};
      parsed.forEach((item: { key?: unknown; value?: unknown }) => {
        if (item.key && typeof item.key === "string" && item.key.trim() !== "") {
          obj[item.key.trim()] = typeof item.value === "string" ? item.value : "";
        }
      });
      return obj;
    }
    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
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
    bestSeller: formData.get("bestSeller") === "true" || formData.get("bestSeller") === "on",
    collectionId: formData.get("collectionId") ? String(formData.get("collectionId")).trim() : undefined,
    productType: String(formData.get("productType") || "").trim() || null,
    attributes: parseAttributesField(formData),
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

  const created = await prisma.product.create({
    data: {
      name: data.name,
      code: await generateProductCode(),
      slug: data.slug,
      description: data.description || "",
      price: data.price,
      bestSeller: data.bestSeller,
      originalPrice: data.originalPrice ?? null,
      stockQuantity: data.stockQuantity,
      collectionId: data.collectionId || null,
      productType: data.productType || null,
      attributes: data.attributes,
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

  await logAudit("product.create", "Product", created.id, { slug: data.slug });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.workerProducts);
}

export async function updateProduct(id: string, formData: FormData) {
  await verifyWorkerCapability("inventory");

  const prev = await prisma.product.findUnique({
    where: { id },
    select: { stockQuantity: true, slug: true },
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
    bestSeller: formData.get("bestSeller") === "true" || formData.get("bestSeller") === "on",
    collectionId: formData.get("collectionId") ? String(formData.get("collectionId")).trim() : undefined,
    productType: String(formData.get("productType") || "").trim() || null,
    attributes: parseAttributesField(formData),
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

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        bestSeller: data.bestSeller,
        price: data.price,
        originalPrice: data.originalPrice ?? null,
        stockQuantity: data.stockQuantity,
        collectionId: data.collectionId || null,
        productType: data.productType || null,
        attributes: data.attributes,
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

  await logAudit("product.update", "Product", id, { slug: data.slug });

  // If the product just went from out-of-stock to in-stock, notify subscribers.
  const wasOutOfStock = (prev?.stockQuantity ?? 0) <= 0;
  if (wasOutOfStock && data.stockQuantity > 0) {
    const { notifyStockSubscribers } = await import("@/actions/stock-alert");
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

const MAX_BULK_IDS = 100;

export async function bulkDeleteProducts(ids: string[]) {
  await verifyWorkerCapability("inventory");

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BULK_IDS) {
    throw new Error(`Bulk operation must include 1-${MAX_BULK_IDS} items.`);
  }

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

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BULK_IDS) {
    throw new Error(`Bulk operation must include 1-${MAX_BULK_IDS} items.`);
  }

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

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BULK_IDS) {
    throw new Error(`Bulk operation must include 1-${MAX_BULK_IDS} items.`);
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new Error("Stock quantity must be a non-negative integer.");
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
  image: z.string().optional().nullable(),
  banners: z.array(z.string()).optional().default([]),
  parentId: z.string().uuid().optional().nullable(),
  order: z.number().int().optional().default(0),
  showInNav: z.boolean().optional().default(true),
});

function purgeCollectionCache() {
  revalidatePath("/admin/collections");
  revalidatePath("/worker/collections");
  revalidatePath("/", "layout");
  try { updateTag(CACHE_TAGS.collections); } catch {}
  try { updateTag(CACHE_TAGS.navigation); } catch {}
  try { updateTag(CACHE_TAGS.workerCollections); } catch {}
}

function parseBannersArray(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    return [];
  } catch {
    return [];
  }
}

export async function createCollection(formData: FormData) {
  await verifyWorkerCapability("inventory");

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    image: formData.get("image") ? String(formData.get("image")).trim() : null,
    banners: parseBannersArray(formData.get("banners")),
    parentId: formData.get("parentId") ? String(formData.get("parentId")).trim() : null,
    order: formData.get("order") ? parseInt(formData.get("order") as string, 10) : 0,
    showInNav: formData.get("showInNav") === null ? true : formData.get("showInNav") === "true" || formData.get("showInNav") === "on",
  };

  const result = collectionSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const { name, slug, description, image, banners, parentId, order, showInNav } = result.data;

  const resolvedSlug = slug || slugify(name) || `collection-${Date.now()}`;

  const existing = await prisma.collection.findUnique({ where: { slug: resolvedSlug } });
  if (existing) {
    throw new Error(`A collection with the slug "${resolvedSlug}" already exists.`);
  }

  const collection = await prisma.collection.create({
    data: { 
      name, 
      slug: resolvedSlug, 
      description: description || null, 
      image: image || null,
      banners: banners || [],
      parentId: parentId || null,
      order: order ?? 0,
      showInNav: showInNav ?? true
    }
  });

  await logAudit("collection.create", "Collection", collection.id, { name, slug: resolvedSlug });

  purgeCollectionCache();
}

export async function updateCollection(id: string, formData: FormData) {
  await verifyWorkerCapability("inventory");

  const rawData = {
    name: String(formData.get("name") || "").trim(),
    slug: String(formData.get("slug") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    image: formData.get("image") ? String(formData.get("image")).trim() : null,
    banners: parseBannersArray(formData.get("banners")),
    parentId: formData.get("parentId") ? String(formData.get("parentId")).trim() : null,
    order: formData.get("order") ? parseInt(formData.get("order") as string, 10) : 0,
    showInNav: formData.get("showInNav") === null ? true : formData.get("showInNav") === "true" || formData.get("showInNav") === "on",
  };

  const result = collectionSchema.safeParse(rawData);
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }

  const { name, slug, description, image, banners, parentId, order, showInNav } = result.data;

  const resolvedSlug = slug || slugify(name) || `collection-${Date.now()}`;

  const existing = await prisma.collection.findUnique({ where: { slug: resolvedSlug } });
  if (existing && existing.id !== id) {
    throw new Error(`A collection with the slug "${resolvedSlug}" already exists.`);
  }

  // Prevent setting self as parent
  if (parentId && parentId === id) {
    throw new Error("A category cannot be its own parent.");
  }

  await prisma.collection.update({
    where: { id },
    data: { 
      name, 
      slug: resolvedSlug, 
      description: description || null, 
      image: image || null,
      banners: banners || [],
      parentId: parentId || null,
      order: order ?? 0,
      showInNav: showInNav ?? true
    }
  });

  await logAudit("collection.update", "Collection", id, { slug: resolvedSlug });

  purgeCollectionCache();
}

export async function deleteCollection(id: string) {
  await verifyWorkerCapability("inventory");

  // Unlink products from this collection so they are preserved
  await prisma.product.updateMany({
    where: { collectionId: id },
    data: { collectionId: null }
  });

  // Unlink child subcategories if this was a parent category
  await prisma.collection.updateMany({
    where: { parentId: id },
    data: { parentId: null }
  });

  await prisma.collection.delete({
    where: { id }
  });

  await logAudit("collection.delete", "Collection", id);

  purgeCollectionCache();
}

export async function updateCollectionOrder(id: string, newOrder: number) {
  await verifyWorkerCapability("inventory");

  await prisma.collection.update({
    where: { id },
    data: { order: newOrder }
  });

  await logAudit("collection.reorder", "Collection", id, { order: newOrder });

  purgeCollectionCache();
}

export async function swapCollectionOrder(
  id1: string,
  order1: number,
  id2: string,
  order2: number
) {
  await verifyWorkerCapability("inventory");

  await prisma.$transaction([
    prisma.collection.update({
      where: { id: id1 },
      data: { order: order1 }
    }),
    prisma.collection.update({
      where: { id: id2 },
      data: { order: order2 }
    })
  ]);

  await logAudit("collection.swap_order", "Collection", id1, { id1, order1, id2, order2 });

  purgeCollectionCache();
}

export async function toggleCollectionShowInNav(id: string, showInNav: boolean) {
  await verifyWorkerCapability("inventory");

  await prisma.collection.update({
    where: { id },
    data: { showInNav }
  });

  await logAudit("collection.toggle_show_in_nav", "Collection", id, { showInNav });

  purgeCollectionCache();
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

  // Per-item guard: refund cannot exceed the sum of order item line totals.
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: { price: true, quantity: true },
  });
  const itemLineTotalSum = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAlreadyRefunded = order.refundedAmount || 0;
  if (totalAlreadyRefunded + amount > itemLineTotalSum) {
    throw new Error(`Cannot refund more than the item total (₹${itemLineTotalSum.toFixed(2)}). Refund is capped at ₹${Math.max(0, itemLineTotalSum - totalAlreadyRefunded).toFixed(2)}.`);
  }

  const isOnlineRefund = order.paymentMethod === "RAZORPAY" && !!order.razorpayPaymentId;
  if (isOnlineRefund && !razorpayConfigured()) {
    throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to issue online refunds.");
  }

  const prevPaymentStatus = order.paymentStatus;

  // Atomic, concurrency-safe claim of the refund amount. Guards against two
  // simultaneous refunds collectively exceeding the remaining balance.
  // NOTE: The Razorpay API call below is outside the transaction. In the rare
  // case of two concurrent admin refunds, both DB claims may succeed before
  // either gateway call completes. The WHERE guard (`refundedAmount <= total - amount`)
  // prevents overlapping amounts, and failures are reverted. For higher-scale
  // operations, consider a distributed lock or refund queue.
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
    await prisma.order.updateMany({
      where: { id: orderId, refundedAmount: { gte: amount } },
      data: { refundedAmount: { decrement: amount }, paymentStatus: prevPaymentStatus },
    });
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

  // Use crypto.randomUUID() — cryptographically strong, no Math.random()
  const fileName = `${crypto.randomUUID()}.${detected.ext}`;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": detected.mime,
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload: ${err}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
}

export async function uploadMedia(formData: FormData) {
  await verifyWorkerCapability("inventory");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided.");

  // Server-side file size validation (50 MB for media)
  const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024;
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error("File is too large. Maximum size is 50 MB.");
  }

  // Sniff the actual content
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Import dynamically to avoid circular dependencies if any
  const { detectMediaType } = await import("@/lib/storage/image-upload");
  const detected = detectMediaType(bytes);
  
  if (!detected) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, GIF, and MP4 files are allowed.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const fileName = `${crypto.randomUUID()}.${detected.ext}`;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": detected.mime,
    },
    body: file,
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
    data: { isDisabled, tokenVersion: { increment: 1 } }
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address format.");
    }
    const emailConflict = await prisma.user.findFirst({
      where: { email, id: { not: userId } },
    });
    if (emailConflict) {
      throw new Error("This email address is already in use by another account.");
    }
  }
  if (phoneNumber) {
    if (!/^\d{10}$/.test(phoneNumber)) {
      throw new Error("Phone number must be exactly 10 digits.");
    }
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

export async function updateUserRole(userId: string, role: "CUSTOMER" | "MULTI_WORKER") {
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
    data: { role, tokenVersion: { increment: 1 } },
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email address format.");
  }
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password.length > 128) throw new Error("Password must not exceed 128 characters.");

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phoneNumber ? [{ phoneNumber }] : [])] },
  });
  if (existing) {
    throw new Error("A user with that email or phone already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("AWB assignment failed:", err);
      // Clean up the draft order in the database so it can be retried
      await prisma.order.update({
        where: { id: orderId },
        data: { shiprocketOrderId: null, shipmentId: null }
      });
      throw new Error(`Failed to assign tracking number: ${message}`);
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

  // Sanitize: strip all HTML tags (including malformed ones) and limit length to prevent stored XSS.
  // The regex handles tags with attributes, self-closing tags, and catches opening tags even when
  // the closing > is missing by matching up to the next tag or end of string.
  const sanitized = (internalNotes || "").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, "").trim().substring(0, 2000);

  await prisma.order.update({
    where: { id: orderId },
    data: { internalNotes: sanitized || null }
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

export async function printShippingLabel(orderId: string) {
  await verifyWorkerCapability("shipping");
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { shipmentId: true }
  });

  if (!order) throw new Error("Order not found");
  if (!order.shipmentId) throw new Error("Order has not been shipped via Shiprocket yet");

  const { generateLabelUrl } = await import("@/lib/integrations/shiprocket");
  const url = await generateLabelUrl(order.shipmentId);
  
  if (!url) throw new Error("Failed to generate label from Shiprocket");
  return url;
}

export async function markOrderAsPacked(orderId: string) {
  await verifyWorkerCapability("shipping");

  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new Error("Order not found");
  }
  
  if (order.status !== "PENDING") {
    throw new Error("Only pending orders can be marked as packed.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "READY_TO_SHIP",
      readyToShipAt: new Date(),
    }
  });

  await logAudit("order.packed", "Order", orderId, { previousStatus: "PENDING" });
  
  revalidatePath("/worker/orders");
  revalidatePath(`/worker/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
