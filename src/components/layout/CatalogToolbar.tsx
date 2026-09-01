"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function BackArrowSvg({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7.17831 12.7092H30V16.4592H7.17831L17.2357 26.5165L14.5841 29.1681L0 14.5842L14.5841 0L17.2357 2.65164L7.17831 12.7092Z"
        fill="#BF9351"
      />
    </svg>
  );
}

export default function CatalogToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") || "newest";
  const currentStock = searchParams.get("stock") || "all";
  const currentPriceRange = searchParams.get("priceRange") || "all";

  const sortLabels: Record<string, string> = {
    newest: "Newest",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "name-asc": "Name: A to Z",
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleParamChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "newest" || !value) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const hasActiveFilters = currentStock !== "all" || currentPriceRange !== "all";

  return (
    <div className="w-full bg-white">
      {/* Bordered Bar matching exact mockup across mobile and desktop */}
      <div className="w-full border-y border-[#BF9351]/50 bg-white">
        
        {/* Desktop Single-Row Layout (md and up) */}
        <div className="hidden md:flex items-stretch h-12 md:h-13 w-full">
          {/* Back Button (left) */}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-16 md:w-20 flex items-center justify-center hover:bg-[#FAF6F0] transition-colors border-r border-[#BF9351]/50 shrink-0"
          >
            <BackArrowSvg className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Search Box (fixed width with beige fill) */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-80 lg:w-96 flex items-stretch relative bg-[#EFE5D6] border-r border-[#BF9351]/50 shrink-0"
          >
            <div className="flex items-center justify-center pl-4 pr-2 text-[#4A3B2C]">
              <i className="ri-search-line text-base text-gray-700" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-full bg-transparent px-2 text-sm text-[#4A3B2C] placeholder:text-gray-500 focus:outline-none"
            />
          </form>

          {/* Spacer */}
          <div className="flex-1 bg-white" />

          {/* Sort By Dropdown (right) */}
          <div className="relative flex items-stretch shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="px-6 lg:px-10 flex items-center gap-2 text-xs font-serif tracking-widest uppercase text-[#5C4A3A] hover:bg-[#FAF6F0] transition-colors border-l border-[#BF9351]/50 whitespace-nowrap"
            >
              <span>SORT BY</span>
              <i className={`ri-arrow-down-s-line text-sm text-[#BF9351] transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#BF9351]/50 shadow-lg z-50 py-1.5">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      handleParamChange("sort", key);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                      currentSort === key
                        ? "bg-[#EFE5D6] text-[#BF9351] font-bold"
                        : "text-[#4A3B2C] hover:bg-[#FAF6F0]"
                    }`}
                  >
                    <span>{label}</span>
                    {currentSort === key && <i className="ri-check-line text-xs text-[#BF9351]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button (far right) */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="px-6 lg:px-10 flex items-center gap-2 text-xs font-serif tracking-widest uppercase text-[#5C4A3A] hover:bg-[#FAF6F0] transition-colors border-l border-[#BF9351]/50 relative shrink-0 whitespace-nowrap"
          >
            <span>FILTER</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#BF9351]" />
            )}
          </button>
        </div>

        {/* Mobile 2-Row Stacked Layout (< md) */}
        <div className="flex md:hidden flex-col w-full">
          {/* Top Row: Back Arrow + Full Width Beige Search Input */}
          <div className="flex items-stretch h-11 w-full border-b border-[#BF9351]/50">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-13 flex items-center justify-center bg-white hover:bg-[#FAF6F0] transition-colors border-r border-[#BF9351]/50 shrink-0"
            >
              <BackArrowSvg className="w-6 h-6" />
            </button>

            {/* Search Input Box spanning remaining width with beige fill */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-stretch relative bg-[#EFE5D6]"
            >
              <div className="flex items-center justify-center pl-3.5 pr-2 text-gray-700">
                <i className="ri-search-line text-sm" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-full bg-transparent px-1 text-xs text-[#4A3B2C] placeholder:text-gray-500 focus:outline-none"
              />
            </form>
          </div>

          {/* Bottom Row: 50% SORT BY ∨ | 50% FILTER */}
          <div className="grid grid-cols-2 h-11 w-full bg-white relative">
            {/* Mobile Sort Button (left column) */}
            <div className="relative flex items-stretch border-r border-[#BF9351]/50">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full h-full flex items-center justify-center gap-1.5 text-xs font-serif tracking-widest uppercase text-[#5C4A3A] hover:bg-[#FAF6F0] transition-colors"
              >
                <span>SORT BY</span>
                <i className={`ri-arrow-down-s-line text-sm text-[#BF9351] transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortOpen && (
                <div className="absolute left-0 top-full mt-1 w-full min-w-[180px] bg-white border border-[#BF9351]/50 shadow-xl z-50 py-1.5">
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        handleParamChange("sort", key);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                        currentSort === key
                          ? "bg-[#EFE5D6] text-[#BF9351] font-bold"
                          : "text-[#4A3B2C] hover:bg-[#FAF6F0]"
                      }`}
                    >
                      <span>{label}</span>
                      {currentSort === key && <i className="ri-check-line text-xs text-[#BF9351]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Filter Button (right column) */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="w-full h-full flex items-center justify-center gap-1.5 text-xs font-serif tracking-widest uppercase text-[#5C4A3A] hover:bg-[#FAF6F0] transition-colors relative"
            >
              <span>FILTER</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#BF9351]" />
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Slide-over Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between pb-4 border-b border-[#BF9351]/30 mb-6">
              <h2 className="font-serif text-xl text-[#4A3B2C] tracking-wide">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="p-1 text-gray-500 hover:text-black transition-colors"
                aria-label="Close filters"
              >
                <i className="ri-close-line text-2xl" />
              </button>
            </div>

            {/* Filter: Stock Availability */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B2C] mb-3">
                Availability
              </label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Items" },
                  { value: "instock", label: "In Stock Only" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleParamChange("stock", opt.value)}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded border transition-colors flex items-center justify-between ${
                      currentStock === opt.value
                        ? "border-[#BF9351] bg-[#EFE5D6] text-[#BF9351] font-semibold"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {currentStock === opt.value && <i className="ri-check-line text-[#BF9351]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter: Price Range */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B2C] mb-3">
                Price Range
              </label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Prices" },
                  { value: "under-1000", label: "Under ₹1,000" },
                  { value: "1000-5000", label: "₹1,000 - ₹5,000" },
                  { value: "over-5000", label: "Over ₹5,000" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleParamChange("priceRange", opt.value)}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded border transition-colors flex items-center justify-between ${
                      currentPriceRange === opt.value
                        ? "border-[#BF9351] bg-[#EFE5D6] text-[#BF9351] font-semibold"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {currentPriceRange === opt.value && <i className="ri-check-line text-[#BF9351]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-[#BF9351]/30 flex gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("stock");
                    params.delete("priceRange");
                    params.delete("page");
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border border-[#BF9351] text-[#4A3B2C] hover:bg-[#FAF6F0] transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#BF9351] text-white hover:bg-[#A87E3E] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
