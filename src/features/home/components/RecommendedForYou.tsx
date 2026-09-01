import { prisma } from "@/lib/db/prisma";
import { getRecentlyViewedProductIds } from "@/lib/recently-viewed";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import ProductCard from "@/components/shared/ProductCard";

export default async function RecommendedForYou() {
  const recentIds = await getRecentlyViewedProductIds();
  if (recentIds.length === 0) return null;

  // Single query: products that share a collection with something the user viewed,
  // excluding the items they already viewed. Avoids the extra lookups entirely.
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
  if (recommended.length === 0) return null;

  const sales = await getActiveFlashSales();
  const withPricing = applyFlashToProductList(recommended, sales).map(({ reviews, ...p }) => {
    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
    return { ...p, reviewCount, averageRating };
  });

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#B6925B] tracking-wider">Recommended For You</h2>
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {withPricing.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
