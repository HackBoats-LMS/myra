import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRecentlyViewedProductIds } from "@/lib/recently-viewed";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit({ bucket: "api:recommendations", key: ip, limit: 30, windowSeconds: 60 });

    const recentIds = await getRecentlyViewedProductIds();
    if (recentIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const recommended = await prisma.product.findMany({
      where: {
        deletedAt: null,
        stockQuantity: { gt: 0 },
        id: { notIn: recentIds },
        collection: { products: { some: { id: { in: recentIds } } } },
      },
      include: { reviews: { select: { rating: true } } },
      take: 4,
    });

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
