import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";
import { createSignedObjectUrls, REVIEW_IMAGES_BUCKET } from "@/lib/storage/image-storage";

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
  workerOrders: "worker-orders",
  workerProducts: "worker-products",
  workerCollections: "worker-collections",
  deliveryOrders: "delivery-orders",
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
  options: {
    tags?: string[] | ((...args: TArgs) => string[]);
    revalidate?: number;
  } = {}
) {
  const staticTags = typeof options.tags === "function" ? [] : (options.tags || []);
  return unstable_cache(queryFn, key, {
    tags: staticTags,
    revalidate: options.revalidate || CACHE_TTL.medium,
    ...(typeof options.tags === "function"
      ? { getDerivedTags: (...args: TArgs) => (options.tags as (...a: TArgs) => string[])(...args) }
      : {}),
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
  {
    tags: (slug: string) => [CACHE_TAGS.product(slug), CACHE_TAGS.products],
    revalidate: CACHE_TTL.medium,
  }
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
    const baseWhere: Prisma.ProductWhereInput = { deletedAt: null, id: { not: productId } };
    const include = { collection: true };

    // 1. Same collection first.
    if (collectionId) {
      const sameCollection = await prisma.product.findMany({
        where: { ...baseWhere, collectionId },
        take,
        orderBy: { createdAt: "desc" },
        include,
      });
      if (sameCollection.length >= take) return sameCollection;
    }

    // 2. Same product type fallback.
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { productType: true },
    });
    if (current?.productType) {
      const sameType = await prisma.product.findMany({
        where: { ...baseWhere, productType: current.productType, ...(collectionId ? { collectionId: { not: collectionId } } : {}) },
        take,
        orderBy: { createdAt: "desc" },
        include,
      });
      if (sameType.length >= take) return sameType;
    }

    // 3. Any other products as a last resort.
    return prisma.product.findMany({
      where: baseWhere,
      take,
      orderBy: { createdAt: "desc" },
      include,
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

// Reviews - derived tag per product so revalidation with CACHE_TAGS.reviews(productId) invalidates correctly
export const getCachedReviews = createCachedQuery(
  ["reviews", "product"],
  async (productId: string) => {
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    // Resolve stored image paths to short-lived signed URLs for display.
    return Promise.all(
      reviews.map(async (review) => {
        const images =
          review.images.length > 0 ? await createSignedObjectUrls(REVIEW_IMAGES_BUCKET, review.images) : [];
        return { ...review, images };
      })
    );
  },
  { tags: (productId: string) => [CACHE_TAGS.reviews(productId)], revalidate: CACHE_TTL.medium }
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
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.medium }
);

// Per-user cart/wishlist counts used in the storefront shell. Short TTL keeps
// them cheap while avoiding a DB hit on every page navigation; mutations call
// updateTag(CACHE_TAGS.*(userId)) to refresh immediately.
export const getCachedCartCount = createCachedQuery(
  ["cart", "count"],
  async (userId: string) => {
    const result = await prisma.cartItem.aggregate({
      where: { cart: { userId } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  },
  { tags: (userId: string) => [CACHE_TAGS.cart(userId)], revalidate: 30 }
);

export const getCachedWishlistCount = createCachedQuery(
  ["wishlist", "count"],
  async (userId: string) => {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      select: { _count: { select: { items: true } } },
    });
    return wishlist?._count.items ?? 0;
  },
  { tags: (userId: string) => [CACHE_TAGS.wishlist(userId)], revalidate: 30 }
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