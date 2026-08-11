"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function FilterControls() {
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
    // Always reset to page 1 when changing filters
    params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full flex flex-wrap gap-4 items-center justify-between border-y border-gray-100 py-4 mb-10 text-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Availability Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Availability:</span>
          <select
            value={currentStock}
            onChange={(e) => handleParamChange("stock", e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#0D3B66] text-gray-700 bg-white"
          >
            <option value="all">All Items</option>
            <option value="instock">In Stock</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Price:</span>
          <select
            value={currentPriceRange}
            onChange={(e) => handleParamChange("priceRange", e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#0D3B66] text-gray-700 bg-white"
          >
            <option value="all">Any Price</option>
            <option value="under-1000">Under ₹1,000</option>
            <option value="1000-5000">₹1,000 - ₹5,000</option>
            <option value="over-5000">Over ₹5,000</option>
          </select>
        </div>
      </div>

      {/* Sorting */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 font-medium">Sort by:</span>
        <select
          value={currentSort}
          onChange={(e) => handleParamChange("sort", e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#0D3B66] text-gray-700 bg-white"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A-Z</option>
        </select>
      </div>
    </div>
  );
}
