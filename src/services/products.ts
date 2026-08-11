import { prisma } from "../lib/prisma";

export async function getProducts(skip?: number, take?: number) {
  return await prisma.product.findMany({
    include: { collection: true },
    orderBy: { createdAt: 'desc' },
    ...(skip !== undefined ? { skip } : {}),
    ...(take !== undefined ? { take } : {}),
  });
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findUnique({
    where: { slug },
    include: { collection: true, reviews: true }
  });
}

export async function getProductsByCollection(collectionSlug: string) {
  return await prisma.product.findMany({
    where: { collection: { slug: collectionSlug } },
    include: { collection: true }
  });
}
