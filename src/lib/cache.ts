import { unstable_cache, revalidateTag as nextRevalidateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";
import { createSignedObjectUrls, REVIEW_IMAGES_BUCKET } from "@/lib/storage/image-storage";

// Cache tags for targeted revalidation
export const CACHE_TAGS = {
  products: "products",
  collections: "collections",
  navigation: "navigation",
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
  banners: "banners",
  brandStories: "brand-stories",
} as const;

// Cache durations (in seconds)
export const CACHE_TTL = {
  short: 60,        // 1 minute
  medium: 300,      // 5 minutes
  long: 3600,       // 1 hour
  veryLong: 86400,  // 24 hours
} as const;

// Generic cached query wrapper
// When `tags` is a static array, wraps the query with unstable_cache directly.
// When `tags` is a function (dynamic per-argument tags), returns a wrapper that
// calls unstable_cache with the args baked into the cache key so each unique
// argument combination gets its own cache entry with the correct tags.
// NOTE: Next.js 16 unstable_cache does NOT support getDerivedTags — we bake
// args into the key instead, which is the correct pattern for this version.
export function createCachedQuery<TArgs extends unknown[], TResult>(
  key: string[],
  queryFn: (...args: TArgs) => Promise<TResult>,
  options: {
    tags?: string[] | ((...args: TArgs) => string[]);
    revalidate?: number;
  } = {}
) {
  const revalidate = options.revalidate || CACHE_TTL.medium;

  if (typeof options.tags === "function") {
    const tagsFn = options.tags;
    // Return a wrapper: each unique args combination gets its own cache entry
    return (...args: TArgs): Promise<TResult> => {
      const argKey = args.map((a) => (a === null || a === undefined ? "__null__" : String(a)));
      const resolvedTags = tagsFn(...args);
      return unstable_cache(
        () => queryFn(...args),
        [...key, ...argKey],
        { tags: resolvedTags, revalidate }
      )();
    };
  }

  const staticTags = options.tags || [];
  return unstable_cache(queryFn, key, { tags: staticTags, revalidate });
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
      where: { 
        deletedAt: null,
        OR: [
          { bestSeller: true },
          { salesCount: { gt: 0 } }
        ]
      },
      take,
      orderBy: [{ bestSeller: "desc" }, { salesCount: "desc" }],
      include: { 
        collection: true,
        reviews: { select: { rating: true } }
      },
    });
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.long }
);

// Recently Viewed Products — fetched server-side on product pages to replace
// the uncached client-side API fetch. Keyed on sorted product ID list.
export const getCachedRecentlyViewedProducts = createCachedQuery(
  ["products", "recently-viewed"],
  async (sortedIds: string[]) => {
    if (sortedIds.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: sortedIds }, deletedAt: null },
      include: { collection: true },
    });
    // Preserve the original cookie order
    return sortedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.medium }
);

export const getCachedRelatedProducts = createCachedQuery(
  ["products", "related"],
  async (productId: string, collectionId: string | null, take: number = 4) => {
    const baseWhere: Prisma.ProductWhereInput = { deletedAt: null, id: { not: productId } };
    const include = { collection: true };

    try {
      // 1. Fetch same collection items & current product type in parallel
      const [sameCollection, current] = await Promise.all([
        collectionId
          ? prisma.product.findMany({
              where: { ...baseWhere, collectionId },
              take,
              orderBy: { createdAt: "desc" },
              include,
            })
          : Promise.resolve([]),
        prisma.product.findUnique({
          where: { id: productId },
          select: { productType: true },
        }),
      ]);

      if (sameCollection.length >= take) return sameCollection;

      let results = [...sameCollection];

      // 2. Fetch same product type fallback if needed
      if (current?.productType) {
        const excludeIds = [productId, ...results.map(p => p.id)];
        const needed = take - results.length;
        const sameType = await prisma.product.findMany({
          where: { ...baseWhere, id: { notIn: excludeIds }, productType: current.productType },
          take: needed,
          orderBy: { createdAt: "desc" },
          include,
        });
        results = [...results, ...sameType];
        if (results.length >= take) return results;
      }

      // 3. Fill remaining with any other products
      const excludeIds = [productId, ...results.map(p => p.id)];
      const needed = take - results.length;
      const fallback = await prisma.product.findMany({
        where: { ...baseWhere, id: { notIn: excludeIds } },
        take: needed,
        orderBy: { createdAt: "desc" },
        include,
      });

      return [...results, ...fallback];
    } catch (err) {
      console.error("[Cache] Related products query failed:", err);
      return [];
    }
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.long }
);

// Collections
export const getCachedAllCollections = createCachedQuery(
  ["collections", "all"],
  async () => {
    return prisma.collection.findMany({
      include: {
        parent: true,
        children: {
          include: { 
            children: {
              include: { _count: { select: { products: true } } },
              orderBy: [{ order: "asc" }, { name: "asc" }]
            },
            _count: { select: { products: true } } 
          },
          orderBy: [{ order: "asc" }, { name: "asc" }]
        },
        _count: { select: { products: true } }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    });
  },
  { tags: [CACHE_TAGS.collections], revalidate: 31536000 }
);

// Full collection by slug — used by collection page AND generateMetadata to avoid
// double raw-Prisma calls. Includes children + parent with subcategory counts.
export const getCachedCollectionBySlug = createCachedQuery(
  ["collection", "slug"],
  async (slug: string) => {
    return prisma.collection.findUnique({
      where: { slug },
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: { select: { products: { where: { deletedAt: null } } } },
                products: {
                  where: { deletedAt: null },
                  take: 1,
                  select: { images: true }
                }
              },
              orderBy: [{ order: "asc" }, { name: "asc" }]
            },
            _count: { select: { products: { where: { deletedAt: null } } } },
            products: {
              where: { deletedAt: null },
              take: 1,
              select: { images: true }
            }
          },
          orderBy: [{ order: "asc" }, { name: "asc" }]
        },
        parent: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    _count: { select: { products: { where: { deletedAt: null } } } }
                  },
                  orderBy: [{ order: "asc" }, { name: "asc" }]
                },
                _count: { select: { products: { where: { deletedAt: null } } } }
              },
              orderBy: [{ order: "asc" }, { name: "asc" }]
            }
          }
        }
      }
    });
  },
  {
    tags: (slug: string) => [CACHE_TAGS.collection(slug), CACHE_TAGS.collections],
    revalidate: CACHE_TTL.long,
  }
);

// Main Top-Level Collections for Navigation & Footer
export const getCachedMainCollections = createCachedQuery(
  ["collections", "main"],
  async () => {
    try {
      return await prisma.collection.findMany({
        where: { parentId: null },
        select: { id: true, name: true, slug: true },
        orderBy: [{ order: "asc" }, { name: "asc" }]
      });
    } catch {
      return [];
    }
  },
  { tags: [CACHE_TAGS.collections], revalidate: 31536000 }
);

// Navigation Tree for Storefront Header
export const getCachedNavigationTree = createCachedQuery(
  ["navigation", "tree"],
  async () => {
    try {
      const topLevel = await prisma.collection.findMany({
        where: { parentId: null, showInNav: true },
        include: {
          children: {
            where: { showInNav: true },
            include: {
              children: {
                where: { showInNav: true },
                orderBy: [{ order: "asc" }, { name: "asc" }]
              }
            },
            orderBy: [{ order: "asc" }, { name: "asc" }]
          }
        },
        orderBy: [{ order: "asc" }, { name: "asc" }]
      });

      if (!topLevel || topLevel.length === 0) {
        return null;
      }

      return topLevel.map((cat) => {
        const hasNestedSections = cat.children.some(
          (sub) => sub.children && sub.children.length > 0
        );

        let sections = undefined;
        let flatChildren: { label: string; href: string }[] = [];

        if (hasNestedSections) {
          const sectionChildren = cat.children.filter((sec) => sec.children && sec.children.length > 0);
          sections = sectionChildren.map((sec) => ({
            title: sec.name.charAt(0).toUpperCase() + sec.name.slice(1),
            href: `/collections/${sec.slug}`,
            items: sec.children.map((item) => ({
              label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
              href: `/collections/${item.slug}`,
            })),
          }));
          flatChildren = sections.flatMap((s) => s.items);
        } else {
          flatChildren = cat.children.map((sub) => ({
            label: sub.name.charAt(0).toUpperCase() + sub.name.slice(1),
            href: `/collections/${sub.slug}`,
          }));
        }

        return {
          label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
          href: `/collections/${cat.slug}`,
          sections,
          children: flatChildren,
        };
      });
    } catch {
      return null;
    }
  },
  { tags: [CACHE_TAGS.collections, CACHE_TAGS.navigation], revalidate: 31536000 }
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
// revalidateTag(CACHE_TAGS.*(userId)) to refresh immediately.
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

// Banners (SSR cached for maximum performance with on-demand invalidation)
// TTL is long because banners rarely change on their own; admin mutations call
// revalidateTag(CACHE_TAGS.banners) immediately after any change.
export const getCachedBanners = createCachedQuery(
  ["banners", "all"],
  async () => {
    return prisma.banner.findMany({
      where: { isActive: true },
    });
  },
  { tags: [CACHE_TAGS.banners], revalidate: CACHE_TTL.long }
);

// Brand Stories (SSR cached for maximum performance with on-demand invalidation)
// TTL is long because brand stories rarely change; admin mutations call
// revalidateTag(CACHE_TAGS.brandStories) immediately after any change.
export const getCachedBrandStories = createCachedQuery(
  ["brand-stories", "all"],
  async () => {
    return prisma.brandStory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  },
  { tags: [CACHE_TAGS.brandStories], revalidate: CACHE_TTL.long }
);

// Revalidation helpers - use revalidateTag from next/cache at call site
export function revalidateTag(tag: string, profile: string | { expire?: number } = { expire: 0 }) {
  try {
    return (nextRevalidateTag as any)(tag, profile);
  } catch (error) {
    console.error(`[cache] Failed to revalidate tag: ${tag}`, error);
  }
}

export const CACHE_REVALIDATE = {
  products: () => CACHE_TAGS.products,
  collections: () => CACHE_TAGS.collections,
  product: (slug: string) => CACHE_TAGS.product(slug),
  collection: (slug: string) => CACHE_TAGS.collection(slug),
  reviews: (productId: string) => CACHE_TAGS.reviews(productId),
  wishlist: (userId: string) => CACHE_TAGS.wishlist(userId),
  cart: (userId: string) => CACHE_TAGS.cart(userId),
  banners: () => CACHE_TAGS.banners,
  brandStories: () => CACHE_TAGS.brandStories,
};

// Dynamic Route Database Caching for filtering and pagination
export const getCachedFilteredProducts = createCachedQuery(
  ["products", "filtered"],
  async (
    collectionIds: string[] | null, 
    stock: string, 
    priceRange: string, 
    sort: string, 
    page: number, 
    itemsPerPage: number,
    specialFilter?: "best-sellers" | "new-arrivals"
  ) => {
    const whereClause: Prisma.ProductWhereInput = { deletedAt: null };
    
    // Ignore explicit collectionIds if it's a dynamic smart collection
    if (collectionIds && collectionIds.length > 0 && !specialFilter) {
      whereClause.collectionId = { in: collectionIds };
    }

    if (specialFilter === "best-sellers") {
      // Only include items that are manually marked as Best Seller OR have organically sold at least once
      whereClause.OR = [
        { bestSeller: true },
        { salesCount: { gt: 0 } }
      ];
    }
    
    if (stock === 'instock') whereClause.stockQuantity = { gt: 0 };
    if (priceRange === 'under-1000') whereClause.price = { lt: 1000 };
    else if (priceRange === '1000-5000') whereClause.price = { gte: 1000, lte: 5000 };
    else if (priceRange === 'over-5000') whereClause.price = { gt: 5000 };

    let orderByClause: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' };
    
    if (sort === 'price-asc') orderByClause = { price: 'asc' };
    else if (sort === 'price-desc') orderByClause = { price: 'desc' };
    else if (sort === 'name-asc') orderByClause = { name: 'asc' };
    else if (sort === 'newest') {
      if (specialFilter === "best-sellers") {
        orderByClause = [{ bestSeller: "desc" }, { salesCount: "desc" }];
      } else {
        orderByClause = { createdAt: 'desc' };
      }
    }

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        include: { reviews: { select: { rating: true } } }
      }),
      prisma.product.count({ where: whereClause })
    ]);
    return { products, totalProducts };
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.short }
);

export const getCachedSearchProducts = createCachedQuery(
  ["products", "search"],
  async (query: string, stock: string, priceRange: string, sort: string, page: number, itemsPerPage: number) => {
    const whereClause: Prisma.ProductWhereInput = { 
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
      ],
    };
    
    if (stock === 'instock') whereClause.stockQuantity = { gt: 0 };
    if (priceRange === 'under-1000') whereClause.price = { lt: 1000 };
    else if (priceRange === '1000-5000') whereClause.price = { gte: 1000, lte: 5000 };
    else if (priceRange === 'over-5000') whereClause.price = { gt: 5000 };

    let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price-asc') orderByClause = { price: 'asc' };
    else if (sort === 'price-desc') orderByClause = { price: 'desc' };
    else if (sort === 'name-asc') orderByClause = { name: 'asc' };

    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        include: { collection: true, reviews: { select: { rating: true } } }
      }),
      prisma.product.count({ where: whereClause })
    ]);
    return { products, totalProducts };
  },
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.short }
);
