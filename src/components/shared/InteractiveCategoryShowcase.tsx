"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Sparkles, ArrowRight, LayoutGrid, Layers, ChevronDown, ChevronUp } from "lucide-react";

export interface VarietyItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sampleImage?: string | null;
  productCount: number;
  sectionName: string;
  sectionSlug: string;
}

export interface SectionGroup {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sampleImage?: string | null;
  productCount: number;
  varieties: VarietyItem[];
}

interface InteractiveCategoryShowcaseProps {
  departmentName: string;
  sections: SectionGroup[];
  flatVarietiesFallback?: VarietyItem[];
}

// Heritage Saree & Fabric Motif Vector for cards without an uploaded photo
function HeritageFabricIcon({ className = "w-7 h-7 text-[#7A0B2E]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 12L34 18V30L24 36L14 30V18L24 12Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <path
        d="M24 4V44M6 14L42 34M6 34L42 14"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />
      <circle cx="24" cy="24" r="3" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export default function InteractiveCategoryShowcase({
  departmentName,
  sections,
  flatVarietiesFallback = [],
}: InteractiveCategoryShowcaseProps) {
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"sections" | "grid">("sections");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Flatten all varieties across sections
  const allVarieties: VarietyItem[] = useMemo(() => {
    if (sections.length > 0) {
      return sections.flatMap((sec) =>
        sec.varieties.length > 0
          ? sec.varieties
          : [
              {
                id: sec.id,
                name: sec.name,
                slug: sec.slug,
                image: sec.image,
                sampleImage: sec.sampleImage,
                productCount: sec.productCount,
                sectionName: sec.name,
                sectionSlug: sec.slug,
              },
            ]
      );
    }
    return flatVarietiesFallback;
  }, [sections, flatVarietiesFallback]);

  // Filtered varieties based on active tab and search query
  const filteredVarieties = useMemo(() => {
    let list = allVarieties;

    if (selectedSection !== "all") {
      list = list.filter((v) => v.sectionSlug === selectedSection || v.sectionName === selectedSection);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) => v.name.toLowerCase().includes(q) || v.sectionName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allVarieties, selectedSection, searchQuery]);

  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const totalVarietiesCount = allVarieties.length;

  return (
    <section className="border-b border-[#7A0B2E]/15 bg-[#FDFAF7] py-10 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sans font-bold uppercase tracking-widest bg-[#7A0B2E]/10 text-[#7A0B2E] border border-[#7A0B2E]/20">
                <Sparkles className="w-3 h-3" />
                {totalVarietiesCount} Handcrafted Weaves
              </span>
              <span className="text-xs text-gray-400 font-serif italic">Curated Catalogue</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#2D1F2F] tracking-tight capitalize">
              Explore {departmentName} Collections
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-serif mt-1 max-w-2xl">
              Browse by weave, fabric heritage, or occasion. Select a category below or search for specific craftsmanship.
            </p>
          </div>

          {/* View Mode Switcher */}
          {sections.length > 0 && (
            <div className="inline-flex items-center bg-[#F5EFE6] border border-[#7A0B2E]/20 p-1 rounded-none self-start md:self-auto shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("sections")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif transition-all cursor-pointer ${
                  viewMode === "sections"
                    ? "bg-[#7A0B2E] text-white shadow-xs font-semibold"
                    : "text-[#2D1F2F] hover:text-[#7A0B2E]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>By Section</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#7A0B2E] text-white shadow-xs font-semibold"
                    : "text-[#2D1F2F] hover:text-[#7A0B2E]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Varieties ({totalVarietiesCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Interactive Controls Bar: Section Filter Tabs & Live Search Input */}
        <div className="bg-white border border-[#7A0B2E]/20 p-3 sm:p-4 mb-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Tabs */}
            {sections.length > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedSection("all")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-serif tracking-wide whitespace-nowrap transition-all border cursor-pointer ${
                    selectedSection === "all"
                      ? "bg-[#7A0B2E] text-white border-[#7A0B2E] font-bold shadow-xs"
                      : "bg-[#FDFAF7] text-[#2D1F2F] border-[#7A0B2E]/20 hover:border-[#7A0B2E] hover:text-[#7A0B2E]"
                  }`}
                >
                  <span>All {departmentName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-none ${
                      selectedSection === "all" ? "bg-white/20 text-white" : "bg-[#F5EFE6] text-[#7A0B2E]"
                    }`}
                  >
                    {totalVarietiesCount}
                  </span>
                </button>

                {sections.map((sec) => {
                  const isSelected = selectedSection === sec.slug;
                  const count = sec.varieties.length > 0 ? sec.varieties.length : 1;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSection(isSelected ? "all" : sec.slug)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-serif tracking-wide whitespace-nowrap transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[#7A0B2E] text-white border-[#7A0B2E] font-bold shadow-xs"
                          : "bg-[#FDFAF7] text-[#2D1F2F] border-[#7A0B2E]/20 hover:border-[#7A0B2E] hover:text-[#7A0B2E]"
                      }`}
                    >
                      <span>{sec.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-none ${
                          isSelected ? "bg-white/20 text-white" : "bg-[#F5EFE6] text-[#7A0B2E]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Live Interactive Search */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${totalVarietiesCount} varieties (e.g. Kanchi, Banaras)...`}
                className="w-full pl-9 pr-8 py-2 text-xs font-serif text-[#2D1F2F] bg-[#FDFAF7] border border-[#7A0B2E]/20 focus:border-[#7A0B2E] focus:outline-none focus:ring-1 focus:ring-[#7A0B2E] transition-all rounded-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Mode 1: Curated Sections Showcase */}
        {viewMode === "sections" && !searchQuery.trim() && selectedSection === "all" ? (
          <div className="space-y-6">
            {sections.map((section) => {
              const varieties = section.varieties;
              const isExpanded = expandedSections[section.id] ?? false;

              return (
                <div
                  key={section.id}
                  className="bg-white border border-[#5C0820]/20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all rounded-sm overflow-hidden"
                >
                  {/* Section Title & Action Header */}
                  <div
                    onClick={() => toggleSectionExpand(section.id)}
                    className="flex flex-row items-center justify-between gap-4 cursor-pointer group p-4 sm:p-6 bg-[#5C0820] text-white"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-2xl font-serif font-bold tracking-wide text-white group-hover:text-white/90 transition-colors">
                          {section.name}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-widest bg-white/20 text-white border border-white/30 rounded-sm whitespace-nowrap">
                          {varieties.length} Varieties
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs font-serif text-white/80 mt-1 sm:mt-1.5 leading-snug">
                        Handcrafted {section.name.toLowerCase()} collections & signature weaves
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <button 
                        type="button"
                        className="text-white p-1.5 sm:p-2 bg-white/10 group-hover:bg-white/20 border border-white/30 transition-all rounded-full flex items-center justify-center"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Variety Cards Grid */}
                  {isExpanded && (
                    <div className="animate-in fade-in duration-300 p-5 sm:p-7">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 lg:gap-3">
                        {varieties.map((variety) => (
                          <VarietyCard key={variety.id} variety={variety} />
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-5 border-t border-[#7A0B2E]/10 flex justify-center">
                        <Link
                          href={`/collections/${section.slug}`}
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-sans font-bold uppercase tracking-widest text-[#7A0B2E] bg-[#F5EFE6] hover:bg-[#7A0B2E] hover:text-white border border-[#7A0B2E]/30 transition-all"
                        >
                          <span>Explore All {section.name}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode 2: All Varieties Grid (Filterable & Searchable) */
          <div>
            {filteredVarieties.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-serif text-gray-500 italic">
                    Showing {filteredVarieties.length} {filteredVarieties.length === 1 ? "variety" : "varieties"}
                    {searchQuery ? ` matching "${searchQuery}"` : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 lg:gap-3">
                  {filteredVarieties.map((variety) => (
                    <VarietyCard key={variety.id} variety={variety} showSectionTag={false} />
                  ))}
                </div>
              </>
            ) : (
              /* Empty Search State */
              <div className="py-16 text-center bg-white border border-[#7A0B2E]/15 p-8">
                <HeritageFabricIcon className="w-12 h-12 text-[#7A0B2E]/40 mx-auto mb-3" />
                <h4 className="font-serif text-lg text-[#2D1F2F] font-bold">No varieties found</h4>
                <p className="text-xs text-gray-500 font-serif mt-1">
                  We couldn't find any varieties matching "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSection("all");
                  }}
                  className="mt-4 px-4 py-2 bg-[#7A0B2E] text-white text-xs font-sans font-bold uppercase tracking-widest hover:bg-[#5C0820] transition-colors cursor-pointer"
                >
                  View All Varieties
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function VarietyCard({
  variety,
  showSectionTag = false,
}: {
  variety: VarietyItem;
  showSectionTag?: boolean;
}) {
  const displayImage = variety.image || variety.sampleImage;

  return (
    <Link
      href={`/collections/${variety.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden bg-[#F5EFE6]"
    >
      {/* Background Image */}
      {displayImage ? (
        <Image
          src={displayImage}
          alt={variety.name}
          fill
          quality={85}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#FAF0F2] via-[#F5EFE6] to-[#EEDFD7]">
          <HeritageFabricIcon className="w-10 h-10 text-[#7A0B2E]/30 group-hover:text-[#7A0B2E]/50 group-hover:scale-110 transition-all duration-300" />
        </div>
      )}

      {/* Gradient Overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Text Content (centered at bottom, handling bigger names) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-center text-center justify-end">
        <h4 className="font-sans text-sm sm:text-base font-medium text-white uppercase tracking-widest break-words w-full drop-shadow-md">
          {variety.name}
        </h4>
      </div>
    </Link>
  );
}
