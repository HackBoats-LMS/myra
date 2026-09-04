import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRecentlyViewedProductIds } from "@/lib/recently-viewed";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";

export async function GET() {
  try {
    const recentIds = await getRecentlyViewedProductIds();
    if (recentIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: recentIds },
        deletedAt: null,
      },
      include: {
        collection: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Preserve the order of recentIds
    const orderedProducts = recentIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    const sales = await getActiveFlashSales();
    const withPricing = applyFlashToProductList(orderedProducts, sales);

    return NextResponse.json({ products: withPricing });
  } catch (error) {
    console.error("Failed to fetch recently viewed products:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
