"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createPortal } from "react-dom";

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
        fill="#7A0B2E"
      />
    </svg>
  );
}

// Reusable chip button used inside the filter drawer
function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-full border transition-all duration-150 font-serif ${
        active
          ? "bg-[#7A0B2E] border-[#7A0B2E] text-white font-semibold shadow-sm"
          : "bg-white border-[#C3A29B]/60 text-[#2D1F2F] hover:border-[#7A0B2E]/60 hover:bg-[#EBDCD9]/40"
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
      {active && (
        <span className="ml-0.5 text-white/80">
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

// Section header inside the drawer
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A0B2E] mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-[#C3A29B]/40" />
        {title}
        <span className="flex-1 h-px bg-[#C3A29B]/40" />
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

import type { NavLink } from "@/lib/navigation";

export default function CatalogToolbar({ backHref = "/", navLinks = [] }: { backHref?: string, navLinks?: NavLink[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortRef = useRef<HTMLDivElement>(null);
  const mobileSortRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") || "newest";
  const currentStock = searchParams.get("stock") || "all";
  const currentPriceRange = searchParams.get("priceRange") || "all";
  const currentDiscount = searchParams.get("discount") || "all";
  const currentRating = searchParams.get("rating") || "all";
  const currentCategory = searchParams.get("category") || "all";
  const currentSubcat = searchParams.get("subcat") || "all";

  const sortLabels: Record<string, string> = {
    newest: "Newest",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    "name-asc": "Name: A to Z",
  };

  // Close desktop sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileSortRef.current && !mobileSortRef.current.contains(event.target as Node)) {
        setIsMobileSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll lock: prevent background scrolling when filter drawer is open.
  // We apply overflow: hidden and height: 100vh to both html and body elements.
  // This forces mobile browsers (like iOS Safari) to truly freeze the background.
  useEffect(() => {
    if (isFilterOpen) {
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100vh";
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [isFilterOpen]);

  const handleParamChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "newest" || !value) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    params.delete("page");
    // scroll: false keeps the user's position — no jump to top on filter change
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Derive category context for dynamic filters
  const cleanPath = pathname.split("?")[0];
  const isSpecialPage = cleanPath === "/collections" || cleanPath === "/search" || cleanPath.startsWith("/collections/best-sellers") || cleanPath.startsWith("/collections/new-arrivals");
  
  let activeTopCategory: NavLink | null = null;
  let subCategories: { label: string; href: string }[] = [];

  if (!isSpecialPage && navLinks.length > 0) {
    for (const topItem of navLinks) {
      const topHref = topItem.href.split("?")[0];
      if (topHref === cleanPath) {
        activeTopCategory = topItem;
        break;
      }
      if (topItem.sections && topItem.sections.some(s => s.href.split("?")[0] === cleanPath || s.items.some(i => i.href.split("?")[0] === cleanPath))) {
        activeTopCategory = topItem;
        break;
      }
      if (topItem.children && topItem.children.some(c => c.href.split("?")[0] === cleanPath)) {
        activeTopCategory = topItem;
        break;
      }
    }
  } else if (isSpecialPage && currentCategory !== "all") {
    activeTopCategory = navLinks.find(nav => nav.href.split("?")[0].split("/").pop() === currentCategory) || null;
  }

  if (activeTopCategory) {
    subCategories = activeTopCategory.sections && activeTopCategory.sections.length > 0
      ? activeTopCategory.sections.flatMap((sec) => sec.items)
      : activeTopCategory.children ?? [];
  } else if (isSpecialPage) {
    subCategories = navLinks.map(nav => ({ label: nav.label, href: nav.href }));
  }

  const hasActiveFilters =
    currentStock !== "all" ||
    currentPriceRange !== "all" ||
    currentDiscount !== "all" ||
    currentRating !== "all" ||
    currentCategory !== "all" ||
    currentSubcat !== "all";

  const activeFilterCount = [
    currentStock !== "all",
    currentPriceRange !== "all",
    currentDiscount !== "all",
    currentRating !== "all",
    currentCategory !== "all" || currentSubcat !== "all",
  ].filter(Boolean).length;

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("stock");
    params.delete("priceRange");
    params.delete("discount");
    params.delete("rating");
    params.delete("category");
    params.delete("subcat");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full bg-white sticky top-0 z-40 shadow-sm">
      {/* Bordered Bar */}
      <div className="w-full border-y border-[#7A0B2E]/50 bg-white">

        {/* Desktop Layout (md+) */}
        <div className="hidden md:flex items-stretch h-12 md:h-13 w-full">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.push(backHref)}
            aria-label="Go back"
            className="w-16 md:w-20 flex items-center justify-center hover:bg-[#EBDCD9]/60 transition-colors border-r border-[#7A0B2E]/50 shrink-0"
          >
            <BackArrowSvg className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-80 lg:w-96 flex items-stretch relative bg-[#EBDCD9]/50 border-r border-[#7A0B2E]/50 shrink-0"
          >
            <div className="flex items-center justify-center pl-4 pr-2 text-[#2D1F2F]">
              <i className="ri-search-line text-base text-gray-700" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-full bg-transparent px-2 text-sm text-[#2D1F2F] placeholder:text-gray-500 focus:outline-none"
            />
          </form>

          {/* Spacer */}
          <div className="flex-1 bg-white" />

          {/* Sort By Dropdown */}
          <div className="relative flex items-stretch shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="px-6 lg:px-10 flex items-center gap-2 text-xs font-serif tracking-widest uppercase text-[#2D1F2F] hover:bg-[#EBDCD9]/60 transition-colors border-l border-[#7A0B2E]/50 whitespace-nowrap"
            >
              <span>SORT BY</span>
              <i className={`ri-arrow-down-s-line text-sm text-[#7A0B2E] transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#C3A29B]/60 shadow-xl z-50 py-1.5 rounded-sm">
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
                        ? "bg-[#EBDCD9] text-[#7A0B2E] font-bold"
                        : "text-[#2D1F2F] hover:bg-[#EBDCD9]/50"
                    }`}
                  >
                    <span>{label}</span>
                    {currentSort === key && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                        <path d="M2 6l3 3 5-5" stroke="#7A0B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="px-6 lg:px-10 flex items-center gap-2 text-xs font-serif tracking-widest uppercase text-[#2D1F2F] hover:bg-[#EBDCD9]/60 transition-colors border-l border-[#7A0B2E]/50 relative shrink-0 whitespace-nowrap"
          >
            <span>FILTER</span>
            {hasActiveFilters && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#7A0B2E] text-white text-[9px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col w-full">
          {/* Top Row: Back + Search */}
          <div className="flex items-stretch h-11 w-full border-b border-[#7A0B2E]/50">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              aria-label="Go back"
              className="w-13 flex items-center justify-center bg-white hover:bg-[#EBDCD9]/60 transition-colors border-r border-[#7A0B2E]/50 shrink-0"
            >
              <BackArrowSvg className="w-6 h-6" />
            </button>

            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-stretch relative bg-[#EBDCD9]/40"
            >
              <div className="flex items-center justify-center pl-3.5 pr-2 text-gray-700">
                <i className="ri-search-line text-sm" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-full bg-transparent px-1 text-xs text-[#2D1F2F] placeholder:text-gray-500 focus:outline-none"
              />
            </form>
          </div>

          {/* Bottom Row: Sort | Filter */}
          <div className="grid grid-cols-2 h-11 w-full bg-white relative">
            {/* Mobile sort — same custom dropdown UI, own independent state */}
            <div className="relative flex items-stretch border-r border-[#7A0B2E]/50" ref={mobileSortRef}>
              <button
                type="button"
                onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
                className="w-full h-full flex items-center justify-center gap-1.5 text-xs font-serif tracking-widest uppercase text-[#2D1F2F] hover:bg-[#EBDCD9]/60 transition-colors"
              >
                <span>SORT BY</span>
                <i className={`ri-arrow-down-s-line text-sm text-[#7A0B2E] transition-transform ${isMobileSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isMobileSortOpen && (
                <div className="absolute left-0 top-full mt-1 w-full min-w-[180px] bg-white border border-[#C3A29B]/60 shadow-xl z-50 py-1.5 rounded-sm">
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        handleParamChange("sort", key);
                        setIsMobileSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                        currentSort === key
                          ? "bg-[#EBDCD9] text-[#7A0B2E] font-bold"
                          : "text-[#2D1F2F] hover:bg-[#EBDCD9]/50"
                      }`}
                    >
                      <span>{label}</span>
                      {currentSort === key && (
                        <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                          <path d="M2 6l3 3 5-5" stroke="#7A0B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="w-full h-full flex items-center justify-center gap-1.5 text-xs font-serif tracking-widest uppercase text-[#2D1F2F] hover:bg-[#EBDCD9]/60 transition-colors relative"
            >
              <span>FILTER</span>
              {hasActiveFilters && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#7A0B2E] text-white text-[9px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================
          Slide-over Filter Drawer — redesigned with home page palette
          Rendered in a portal to escape the sticky header context, ensuring
          desktop scroll events target the drawer and not the background page.
          ============================================================ */}
      {mounted && isFilterOpen && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-[340px] bg-[#FDFAF8] h-[100dvh] shadow-2xl z-10 flex flex-col overflow-hidden animate-slide-in-right">

            {/* Drawer Header */}
            <div
              className="flex items-center justify-between px-6 py-5 border-b border-[#C3A29B]/40"
              style={{ background: "linear-gradient(135deg, #EBDCD9 0%, #F5EFE6 100%)" }}
            >
              <div>
                <h2 className="font-serif text-xl text-[#2D1F2F] tracking-wide">Filters</h2>
                {hasActiveFilters && (
                  <p className="text-[10px] text-[#7A0B2E] mt-0.5 font-medium">
                    {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#7A0B2E] hover:text-[#5C0820] underline underline-offset-2 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 text-gray-500 hover:text-[#7A0B2E] hover:bg-white transition-colors shadow-sm"
                  aria-label="Close filters"
                >
                  <i className="ri-close-line text-xl" />
                </button>
              </div>
            </div>

            {/* Drawer Body — scrollable, overscroll-contain prevents scroll escaping to background */}
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-6 py-6 space-y-1">

              {/* ── 0. Dynamic Categories ── */}
              {subCategories.length > 0 && (
                <FilterSection title={activeTopCategory ? `Subcategories in ${activeTopCategory.label}` : "Categories"}>
                  <FilterChip
                    label={activeTopCategory ? `All ${activeTopCategory.label}` : "All Categories"}
                    active={
                      isSpecialPage
                        ? (activeTopCategory ? currentSubcat === "all" : currentCategory === "all")
                        : (activeTopCategory ? cleanPath === activeTopCategory.href.split("?")[0] : false)
                    }
                    onClick={() => {
                      if (isSpecialPage) {
                        if (activeTopCategory) {
                          handleParamChange("subcat", "all");
                        } else {
                          handleParamChange("category", "all");
                        }
                      } else {
                        if (activeTopCategory && cleanPath !== activeTopCategory.href.split("?")[0]) {
                          router.push(activeTopCategory.href, { scroll: false });
                          setIsFilterOpen(false);
                        }
                      }
                    }}
                  />
                  {subCategories.map((cat) => {
                    const catSlug = cat.href.split("?")[0].split("/").pop();
                    
                    let isActive = false;
                    let onClick = () => {};
                    
                    if (isSpecialPage) {
                      isActive = activeTopCategory ? currentSubcat === catSlug : currentCategory === catSlug;
                      onClick = () => {
                        if (activeTopCategory) {
                          handleParamChange("subcat", isActive ? "all" : (catSlug || ""));
                        } else {
                          handleParamChange("category", isActive ? "all" : (catSlug || ""));
                        }
                      };
                    } else {
                      isActive = cleanPath === cat.href.split("?")[0];
                      onClick = () => {
                        if (!isActive) {
                          router.push(cat.href, { scroll: false });
                          setIsFilterOpen(false); // Close drawer on navigation
                        }
                      };
                    }

                    return (
                      <FilterChip
                        key={cat.href}
                        label={cat.label}
                        active={isActive}
                        onClick={onClick}
                      />
                    );
                  })}
                </FilterSection>
              )}

              {/* ── 1. Availability ── */}
              <FilterSection title="Availability">
                {[
                  { value: "all", label: "All Items" },
                  { value: "instock", label: "In Stock" },
                ].map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={currentStock === opt.value}
                    onClick={() => handleParamChange("stock", opt.value)}
                  />
                ))}
              </FilterSection>

              {/* ── 2. Price Range ── */}
              <FilterSection title="Price Range">
                {[
                  { value: "all", label: "All Prices" },
                  { value: "under-1000", label: "Under ₹1,000" },
                  { value: "1000-5000", label: "₹1,000 – ₹5,000" },
                  { value: "over-5000", label: "Above ₹5,000" },
                ].map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={currentPriceRange === opt.value}
                    onClick={() => handleParamChange("priceRange", opt.value)}
                  />
                ))}
              </FilterSection>

              {/* ── 3. Offers & Discounts ── */}
              <FilterSection title="Offers">
                {[
                  { value: "all", label: "All Products" },
                  { value: "on-sale", label: "On Sale" },
                ].map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={currentDiscount === opt.value}
                    onClick={() => handleParamChange("discount", opt.value)}
                  />
                ))}
              </FilterSection>

              {/* ── 4. Customer Rating ── */}
              <FilterSection title="Customer Rating">
                {[
                  { value: "all", label: "All Ratings" },
                  { value: "4-plus", label: "4 & Above" },
                  { value: "3-plus", label: "3 & Above" },
                ].map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={currentRating === opt.value}
                    onClick={() => handleParamChange("rating", opt.value)}
                  />
                ))}
              </FilterSection>

              {/* ── 5. Sort (inline within drawer for mobile convenience) ── */}
              <FilterSection title="Sort By">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <FilterChip
                    key={key}
                    label={label}
                    active={currentSort === key}
                    onClick={() => handleParamChange("sort", key)}
                  />
                ))}
              </FilterSection>

            </div>

            {/* Drawer Footer */}
            <div
              className="px-6 py-4 border-t border-[#C3A29B]/40 flex gap-3"
              style={{ background: "linear-gradient(180deg, #F5EFE6 0%, #EBDCD9 100%)" }}
            >
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wider border border-[#7A0B2E] text-[#7A0B2E] hover:bg-[#EBDCD9] rounded-sm transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider bg-[#7A0B2E] text-white hover:bg-[#5C0820] rounded-sm transition-colors shadow-sm"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
