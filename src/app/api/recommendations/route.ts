import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getRecentlyViewedProductIds } from "@/lib/recently-viewed";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache";

// Cache recommendations by the set of recently-viewed product IDs.
// Same viewed products → same result, so we can safely cache for 5 min.
// Tag 'products' ensures this is cleared when any product is updated.
const getCachedRecommendations = unstable_cache(
  async (recentIds: string[]) => {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        stockQuantity: { gt: 0 },
        id: { notIn: recentIds },
        collection: { products: { some: { id: { in: recentIds } } } },
      },
      include: { reviews: { select: { rating: true } } },
      take: 4,
    });
  },
  ["recommendations", "by-viewed"],
  { tags: [CACHE_TAGS.products], revalidate: CACHE_TTL.medium }
);

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit({ bucket: "api:recommendations", key: ip, limit: 30, windowSeconds: 60 });

    const recentIds = await getRecentlyViewedProductIds();
    if (recentIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Sort IDs so the cache key is stable regardless of cookie order
    const sortedIds = [...recentIds].sort();
    const recommended = await getCachedRecommendations(sortedIds);

    if (recommended.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const sales = await getActiveFlashSales();
    const withPricing = applyFlashToProductList(recommended, sales).map(({ reviews, ...p }) => {
      const reviewCount = reviews?.length || 0;
      const averageRating = reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
      return { ...p, reviewCount, averageRating };
    });

    return NextResponse.json({ products: withPricing });
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
