import { prisma } from "../lib/prisma";

export async function getAllCollections() {
  return await prisma.collection.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
}
