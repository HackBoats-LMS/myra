import { ProductCardSkeleton } from "@/components/storefront/Skeletons";

export default function ProductDetailsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-10 md:py-20 min-h-screen">
      {/* 2-Column Product Layout Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Left Column: Image Gallery Skeleton */}
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="relative aspect-[3/4] w-full bg-slate-100 rounded-none" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="w-20 h-20 bg-slate-100 rounded-none flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Column: Info Skeleton */}
        <div className="flex flex-col pt-4 md:pt-12 space-y-6 animate-pulse">
          {/* Collection Tag */}
          <div className="h-4 w-24 bg-slate-100 rounded-none" />
          {/* Title */}
          <div className="h-10 w-3/4 bg-slate-100 rounded-none" />
          {/* Price */}
          <div className="h-8 w-32 bg-slate-100 rounded-none" />
          {/* Description Lines */}
          <div className="space-y-2.5 pt-4">
            <div className="h-4 w-full bg-slate-100 rounded-none" />
            <div className="h-4 w-full bg-slate-100 rounded-none" />
            <div className="h-4 w-5/6 bg-slate-100 rounded-none" />
            <div className="h-4 w-2/3 bg-slate-100 rounded-none" />
          </div>
          {/* Add to Bag Button Placeholder */}
          <div className="h-14 w-full bg-slate-100 rounded-none mt-8" />
          {/* Subtext */}
          <div className="h-4 w-1/2 bg-slate-100 rounded-none mx-auto" />
        </div>
      </div>

      {/* Bottom Column: Related Products Skeleton */}
      <section className="mt-24 border-t border-[#B6925B]/20 pt-16">
        <div className="h-8 w-48 bg-slate-100 rounded-none mx-auto mb-10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </section>
    </div>
  );
}
