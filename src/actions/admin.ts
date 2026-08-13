"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { verifyAdmin } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { CACHE_TAGS } from "@/lib/cache";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
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

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  slug: z.string().max(150).optional(),
  description: z.string().max(2000, "Description is too long").optional(),
  price: z.number().min(0, "Price must be positive"),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative"),
  collectionId: z.string().optional(),
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
  await verifyAdmin();

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
    stockQuantity: parseInt(formData.get("stockQuantity") as string, 10),
    collectionId: formData.get("collectionId") ? String(formData.get("collectionId")).trim() : undefined,
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

  const created = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      price: data.price,
      stockQuantity: data.stockQuantity,
      collectionId: data.collectionId || null,
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
}

export async function updateProduct(id: string, formData: FormData) {
  await verifyAdmin();

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
    stockQuantity: parseInt(formData.get("stockQuantity") as string, 10),
    collectionId: formData.get("collectionId") ? String(formData.get("collectionId")).trim() : undefined,
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

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        price: data.price,
        stockQuantity: data.stockQuantity,
        collectionId: data.collectionId || null,
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

      if (originalId) {
        await tx.productVariant.update({ where: { id: originalId }, data: vData });
      } else {
        await tx.productVariant.create({ data: { ...vData, productId: id } });
      }
    }
  });

  await logAudit("product.update", "Product", id, { slug: data.slug });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
}

export async function deleteProduct(id: string) {
  await verifyAdmin();

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await logAudit("product.delete", "Product", id);

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
}

export async function bulkDeleteProducts(ids: string[]) {
  await verifyAdmin();

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date() }
  });

  await logAudit("product.bulkDelete", "Product", undefined, { ids });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
}

export async function bulkUpdateStock(ids: string[], stockQuantity: number) {
  await verifyAdmin();

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { stockQuantity }
  });

  await logAudit("product.bulkUpdateStock", "Product", undefined, { ids, stockQuantity });

  revalidatePath("/admin/products");
  updateTag(CACHE_TAGS.products);
}

const collectionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  slug: z.string().max(150).optional(),
  description: z.string().max(500, "Description is too long").optional(),
  image: z.string().url().optional().nullable(),
});

export async function createCollection(formData: FormData) {
  await verifyAdmin();

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

  const createdCollection = await prisma.collection.create({
    data: { name, slug: resolvedSlug, description: description || null, image: image || null }
  });

  await logAudit("collection.create", "Collection", createdCollection.id, { slug: resolvedSlug });

  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.collections);
}

export async function updateCollection(id: string, formData: FormData) {
  await verifyAdmin();

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

  await prisma.collection.update({
    where: { id },
    data: { name, slug: resolvedSlug, description: description || null, image: image || null }
  });

  await logAudit("collection.update", "Collection", id, { slug: resolvedSlug });

  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.collections);
}

export async function deleteCollection(id: string) {
  await verifyAdmin();

  await prisma.collection.delete({
    where: { id }
  });

  await logAudit("collection.delete", "Collection", id);

  revalidatePath("/admin/collections");
  updateTag(CACHE_TAGS.collections);
}

export async function updateOrderStatus(id: string, status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED") {
  await verifyAdmin();

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { user: true }
  });

  if (status === "SHIPPED" && order.user?.email) {
    import("@/lib/email").then(({ sendOrderShippedEmail }) => {
      sendOrderShippedEmail(order.user.email!, order.id).catch(console.error);
    });
  } else if (status === "DELIVERED" && order.user?.email) {
    import("@/lib/email").then(({ sendOrderDeliveredEmail }) => {
      sendOrderDeliveredEmail(order.user.email!, order.id).catch(console.error);
    });
  }

  await logAudit("order.statusUpdate", "Order", id, { status });

  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${id}`);
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

  await prisma.order.update({
    where: { id: orderId },
    data: {
      refundedAmount: {
        increment: amount
      }
    }
  });

  await logAudit("order.refund", "Order", orderId, { amount });

  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function uploadImage(formData: FormData) {
  await verifyAdmin();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided.");

  // Server-side MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.");
  }

  // Server-side file size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const fileExt = file.name.split(".").pop();
  // Use crypto.randomUUID() — cryptographically strong, no Math.random()
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type,
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
    data: { isDisabled }
  });

  await logAudit("user.toggleDisabled", "User", userId, { isDisabled });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
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
