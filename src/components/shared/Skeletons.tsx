export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="relative aspect-[3/4] w-full bg-slate-100 rounded-none" />
      <div className="h-4 w-3/4 bg-slate-100 rounded-none" />
      <div className="h-4 w-1/4 bg-slate-100 rounded-none" />
    </div>
  );
}

export function CollectionPillSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="w-32 h-44 md:w-48 md:h-64 bg-slate-100 rounded-t-full rounded-b-xl" />
    </div>
  );
}

export function HeroGridSkeleton() {
  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-12 max-w-[1920px] mx-auto bg-white animate-pulse">
      {/* Main Left Banner Skeleton */}
      <div className="lg:col-span-8 min-h-[500px] lg:min-h-[750px] bg-slate-100 relative overflow-hidden" />

      {/* Right Stacked Banners Skeleton */}
      <div className="lg:col-span-4 flex flex-col">
        <div className="flex-1 min-h-[350px] border-b-[8px] border-white lg:border-b-0 lg:border-l-[8px] bg-slate-100" />
        <div className="flex-1 min-h-[350px] lg:border-l-[8px] border-white bg-slate-100" />
      </div>
    </section>
  );
}
