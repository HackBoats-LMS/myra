import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma";

// Cache tags for targeted revalidation
export const CACHE_TAGS = {
  products: "products",
  collections: "collections",
  product: (slug: string) => `product-${slug}`,
  collection: (slug: string) => `collection-${slug}`,
  reviews: (productId: string) => `reviews-${productId}`,
  user: (userId: string) => `user-${userId}`,
  orders: (userId: string) => `orders-${userId}`,
  wishlist: (userId: string) => `wishlist-${userId}`,
  cart: (userId: string) => `cart-${userId}`,
} as const;

// Cache durations (in seconds)
export const CACHE_TTL = {
  short: 60,        // 1 minute
  medium: 300,      // 5 minutes
  long: 3600,       // 1 hour
  veryLong: 86400,  // 24 hours
} as const;

// Generic cached query wrapper
export function createCachedQuery<TArgs extends unknown[], TResult>(
  key: string[],
  queryFn: (...args: TArgs) => Promise<TResult>,
  options: { tags?: string[]; revalidate?: number } = {}
) {
  return unstable_cache(queryFn, key, {
    tags: options.tags || [],
    revalidate: options.revalidate || CACHE_TTL.medium,
  });
}

// Products
export const getCachedProducts = createCachedQuery(
  ["products", "list"],
  async (skip?: number, take?: number) => {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: { collection: true },
      orderBy: { createdAt: "desc" },
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.medium }
);

export const getCachedProductBySlug = createCachedQuery(
  ["product", "slug"],
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug, deletedAt: null },
      include: { collection: true, variants: true },
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.medium }
);

export const getCachedProductsByCollection = createCachedQuery(
  ["products", "collection"],
  async (collectionSlug: string) => {
    return prisma.product.findMany({
      where: { deletedAt: null, collection: { slug: collectionSlug } },
      include: { collection: true },
    });
  },
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: CACHE_TTL.medium }
);

export const getCachedFeaturedProducts = createCachedQuery(
  ["products", "featured"],
  async (take: number = 4) => {
    return prisma.product.findMany({
      where: { deletedAt: null },
      take,
      orderBy: { createdAt: "desc" },
      include: { 
        collection: true,
        reviews: { select: { rating: true } }
      },
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.long }
);

export const getCachedBestSellers = createCachedQuery(
  ["products", "best-sellers"],
  async (take: number = 4) => {
    return prisma.product.findMany({
      where: { deletedAt: null, bestSeller: true },
      take,
      orderBy: { createdAt: "desc" },
      include: { 
        collection: true,
        reviews: { select: { rating: true } }
      },
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.long }
);

export const getCachedRelatedProducts = createCachedQuery(
  ["products", "related"],
  async (productId: string, collectionId: string | null, take: number = 4) => {
    const where: Prisma.ProductWhereInput = { deletedAt: null, id: { not: productId } };
    if (collectionId) where.collectionId = collectionId;
    
    return prisma.product.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: { collection: true },
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.medium }
);

// Collections
export const getCachedAllCollections = createCachedQuery(
  ["collections", "all"],
  async () => {
    return prisma.collection.findMany({
      include: {
        _count: { select: { products: true } }
      }
    });
  },
  { tags: [CACHE_TAGS.collections], revalidate: CACHE_TTL.long }
);

// Reviews - using static tag "reviews" and revalidating with specific product ID
export const getCachedReviews = createCachedQuery(
  ["reviews", "product"],
  async (productId: string) => {
    return prisma.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  },
  { tags: [CACHE_TAGS.reviews("all")], revalidate: CACHE_TTL.medium }
);

// Search suggestions
export const getCachedSearchSuggestions = createCachedQuery(
  ["search", "suggest"],
  async (query: string) => {
    if (!query || query.length < 2) return [];
    
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        collection: { select: { name: true } }
      },
      take: 5,
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.short }
);

// Sitemap data
export const getCachedSitemapData = createCachedQuery(
  ["sitemap", "data"],
  async () => {
    const [products, collections] = await Promise.all([
      prisma.product.findMany({ where: { deletedAt: null }, select: { slug: true, updatedAt: true } }),
      prisma.collection.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
    return { products, collections };
  },
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: CACHE_TTL.veryLong }
);

// Revalidation helpers - use revalidateTag from next/cache at call site
export const CACHE_REVALIDATE = {
  products: () => CACHE_TAGS.products,
  collections: () => CACHE_TAGS.collections,
  product: (slug: string) => CACHE_TAGS.product(slug),
  collection: (slug: string) => CACHE_TAGS.collection(slug),
  reviews: (productId: string) => CACHE_TAGS.reviews(productId),
  wishlist: (userId: string) => CACHE_TAGS.wishlist(userId),
  cart: (userId: string) => CACHE_TAGS.cart(userId),
};