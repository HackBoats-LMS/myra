import { HeroGridSkeleton, CollectionPillSkeleton, ProductCardSkeleton } from "@/components/storefront/Skeletons";

export default function StorefrontLoading() {
  return (
    <div className="w-full bg-white">
      {/* Hero Grid Skeleton */}
      <HeroGridSkeleton />

      {/* Category Showcase (Collections) Skeleton */}
      <section className="w-full pt-20 pb-12 px-8 max-w-7xl mx-auto flex flex-wrap gap-6 md:gap-10 justify-center items-end bg-white">
        {[1, 2, 3, 4, 5].map((idx) => (
          <CollectionPillSkeleton key={idx} />
        ))}
      </section>

      {/* Featured Products Skeleton */}
      <section className="max-w-7xl mx-auto px-8 py-24 border-t border-gray-100">
        <div className="flex flex-col items-center mb-16 space-y-4">
          <div className="h-8 w-64 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-4 w-32 bg-slate-100 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
