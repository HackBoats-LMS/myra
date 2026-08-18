import { prisma } from "@/lib/db/prisma";
import { getRecentlyViewedProductIds } from "@/lib/recently-viewed";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import ProductCard from "@/components/shared/ProductCard";

export default async function RecentlyViewedRail({ currentProductId }: { currentProductId: string }) {
  const ids = await getRecentlyViewedProductIds();
  const withoutCurrent = ids.filter((id) => id !== currentProductId);
  if (withoutCurrent.length === 0) return null;

  const products = await prisma.product.findMany({
    where: { id: { in: withoutCurrent.slice(0, 4) }, deletedAt: null },
    include: { reviews: { select: { rating: true } } },
  });
  if (products.length === 0) return null;

  // Preserve the cookie order (most recently viewed first).
  const ordered = withoutCurrent
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const sales = await getActiveFlashSales();
  const withReviews = applyFlashToProductList(ordered, sales).map(({ reviews, ...product }) => {
    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    return { ...product, reviewCount, averageRating };
  });

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#B6925B] tracking-wider">Recently Viewed</h2>
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {withReviews.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}