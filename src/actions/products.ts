"use server";
import { prisma } from "@/lib/prisma";

export async function getProductsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  // Fetch products and maintain the order they were requested in
  const products = await prisma.product.findMany({
    where: {
      id: { in: ids }
    },
    include: {
      collection: true,
      variants: true
    }
  });

  // Sort by the order in the `ids` array
  return ids
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as typeof products;
}
