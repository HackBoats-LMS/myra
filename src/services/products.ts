import { 
  getCachedProducts, 
  getCachedProductBySlug, 
  getCachedProductsByCollection,
  getCachedFeaturedProducts,
  getCachedBestSellers,
  getCachedRelatedProducts
} from "@/lib/cache";

export async function getProducts(skip?: number, take?: number) {
  return getCachedProducts(skip, take);
}

export async function getProductBySlug(slug: string) {
  return getCachedProductBySlug(slug);
}

export async function getProductsByCollection(collectionSlug: string) {
  return getCachedProductsByCollection(collectionSlug);
}

export async function getFeaturedProducts(take = 4) {
  return getCachedFeaturedProducts(take);
}

export async function getBestSellers(take = 4) {
  return getCachedBestSellers(take);
}

export async function getRelatedProducts(productId: string, collectionId: string | null, take = 4) {
  return getCachedRelatedProducts(productId, collectionId, take);
}

export async function getAllCollections() {
  const { getCachedAllCollections } = await import("@/lib/cache");
  return getCachedAllCollections();
}