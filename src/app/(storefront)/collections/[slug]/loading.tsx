import { ProductCardSkeleton } from "@/components/storefront/Skeletons";

export default function CollectionLoading() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-slate-100 rounded-md" />
        <div className="h-4 w-96 bg-slate-100 rounded-md" />
      </div>

      {/* Grid of Shimmering Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}
