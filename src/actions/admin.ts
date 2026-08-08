"use server"
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    throw new Error("Unauthorized");
  }
}

export async function createProduct(formData: FormData) {
  await verifyAdmin();

  const name = String(formData.get("name") || "").trim().substring(0, 150);
  const slug = String(formData.get("slug") || "").trim().substring(0, 150);
  const description = String(formData.get("description") || "").trim().substring(0, 2000);
  const price = parseFloat(formData.get("price") as string);
  const stockQuantity = parseInt(formData.get("stockQuantity") as string, 10);
  const collectionId = formData.get("collectionId") ? String(formData.get("collectionId")).trim() : "";
  const image = formData.get("image") ? String(formData.get("image")).trim() : "";

  if (!name || !slug || isNaN(price) || isNaN(stockQuantity)) {
    throw new Error("Invalid product data");
  }

  await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      stockQuantity,
      collectionId: collectionId || null,
      images: image ? [image] : [],
    }
  });

  revalidatePath("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await verifyAdmin();

  const name = String(formData.get("name") || "").trim().substring(0, 150);
  const slug = String(formData.get("slug") || "").trim().substring(0, 150);
  const description = String(formData.get("description") || "").trim().substring(0, 2000);
  const price = parseFloat(formData.get("price") as string);
  const stockQuantity = parseInt(formData.get("stockQuantity") as string, 10);
  const collectionId = formData.get("collectionId") ? String(formData.get("collectionId")).trim() : "";
  const image = formData.get("image") ? String(formData.get("image")).trim() : "";

  if (!name || !slug || isNaN(price) || isNaN(stockQuantity)) {
    throw new Error("Invalid product data");
  }

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      price,
      stockQuantity,
      collectionId: collectionId || null,
      images: image ? [image] : [],
    }
  });

  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await verifyAdmin();
  
  await prisma.product.delete({
    where: { id }
  });

  revalidatePath("/admin/products");
}

export async function createCollection(formData: FormData) {
  await verifyAdmin();
  
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  
  await prisma.collection.create({
    data: { name, slug, description }
  });
  
  revalidatePath("/admin/collections");
}

export async function updateCollection(id: string, formData: FormData) {
  await verifyAdmin();
  
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  
  await prisma.collection.update({
    where: { id },
    data: { name, slug, description }
  });
  
  revalidatePath("/admin/collections");
}

export async function deleteCollection(id: string) {
  await verifyAdmin();
  
  await prisma.collection.delete({
    where: { id }
  });
  
  revalidatePath("/admin/collections");
}

export async function updateOrderStatus(id: string, status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') {
  await verifyAdmin();
  
  await prisma.order.update({
    where: { id },
    data: { status }
  });
  
  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${id}`);
}

export async function uploadImage(formData: FormData) {
  await verifyAdmin();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;

  // Upload directly via Supabase REST API using the service_role key to bypass RLS
  const res = await fetch(`${supabaseUrl}/storage/v1/object/product-images/${fileName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload: ${err}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
}
