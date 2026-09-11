import ProductCard from "@/components/shared/ProductCard";
import type { Prisma } from "@/generated/prisma";

type RecentlyViewedProduct = Prisma.ProductGetPayload<{ include: { collection: true } }> & {
  reviewCount?: number;
  averageRating?: number;
  flashPercent?: number;
};

interface RecentlyViewedRailProps {
  products: RecentlyViewedProduct[];
}

export default function RecentlyViewedRail({ products }: RecentlyViewedRailProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
        <div className="h-[1px] w-12 md:w-24 bg-[#7A0B2E]/50"></div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#7A0B2E] tracking-wider">Recently Viewed</h2>
        <div className="h-[1px] w-12 md:w-24 bg-[#7A0B2E]/50"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </section>
  );
}