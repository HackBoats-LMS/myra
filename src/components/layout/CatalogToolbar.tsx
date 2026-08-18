"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function CatalogToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "newest";
  const currentStock = searchParams.get("stock") || "all";
  const currentPriceRange = searchParams.get("priceRange") || "all";

  const handleParamChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "newest" || !value) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    // Always reset to page 1 when changing filters/sort
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white border-b border-[#B6925B]/20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
        {/* Search (left) */}
        <form action="/search" method="GET" className="relative flex-1 min-w-[200px] flex items-center">
          <input
            type="text"
            name="q"
            placeholder="Search products..."
            className="w-full bg-[#FAFAFA] border border-[#B6925B]/30 rounded-none py-2.5 pl-4 pr-11 text-xs text-[#4A3B2C] placeholder:text-gray-400 focus:outline-none focus:border-[#B6925B] focus:bg-white focus:ring-1 focus:ring-[#B6925B] transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B6925B] hover:text-[#4A3B2C] flex items-center justify-center p-1"
            aria-label="Search"
          >
            <i className="ri-search-line text-base leading-none" />
          </button>
        </form>

        {/* Sort & Filter (right) */}
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">
          <label className="hidden lg:block">Sort by:</label>
          <select
            value={currentSort}
            onChange={(e) => handleParamChange("sort", e.target.value)}
            className="border border-[#B6925B]/20 rounded-none px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[#4A3B2C] bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
          </select>

          <select
            value={currentStock}
            onChange={(e) => handleParamChange("stock", e.target.value)}
            className="border border-[#B6925B]/20 rounded-none px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[#4A3B2C] bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
            aria-label="Availability filter"
          >
            <option value="all">All Items</option>
            <option value="instock">In Stock</option>
          </select>

          <select
            value={currentPriceRange}
            onChange={(e) => handleParamChange("priceRange", e.target.value)}
            className="border border-[#B6925B]/20 rounded-none px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[#4A3B2C] bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
            aria-label="Price filter"
          >
            <option value="all">Any Price</option>
            <option value="under-1000">Under ₹1,000</option>
            <option value="1000-5000">₹1,000 - ₹5,000</option>
            <option value="over-5000">Over ₹5,000</option>
          </select>
        </div>
      </div>
    </div>
  );
}