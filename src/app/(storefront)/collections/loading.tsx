export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-10 md:py-10 md:py-20 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col items-center mb-16 gap-4">
        <div className="h-10 w-64 bg-gray-200 rounded-none" />
        <div className="h-4 w-40 bg-gray-100 rounded-none" />
      </div>
      {/* Product grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full bg-gray-200 rounded-none" />
            <div className="h-4 w-3/4 bg-gray-200 rounded-none" />
            <div className="h-3 w-1/3 bg-gray-100 rounded-none" />
          </div>
        ))}
      </div>
    </div>
  );
}
