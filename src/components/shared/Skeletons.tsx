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
    <section className="w-full max-w-[1920px] mx-auto bg-white flex flex-col lg:flex-row animate-pulse">
      {/* Main Banner Skeleton */}
      <div className="w-full lg:w-[60%] aspect-[3/2] bg-slate-100" />

      {/* Sub-Banners Skeleton */}
      <div className="flex w-full lg:w-[40%] flex-row lg:flex-col">
        <div className="w-1/2 lg:w-full aspect-[16/10] lg:aspect-auto lg:flex-1 bg-slate-100" />
        <div className="w-1/2 lg:w-full aspect-[16/10] lg:aspect-auto lg:flex-1 bg-slate-200" />
      </div>
    </section>
  );
}
