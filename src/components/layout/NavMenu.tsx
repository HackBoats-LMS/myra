"use client";
import { useState } from "react";
import Link from "next/link";
import type { NavLink } from "@/lib/navigation";

function formatLabel(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function NavMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="flex items-center gap-6 lg:gap-8 whitespace-nowrap">
      {links.map((item, index) => {
        const isOpen = open === item.label;
        const hasSections = Boolean(item.sections && item.sections.length > 0);
        const hasChildren = hasSections || (item.children && item.children.length > 0);
        const displayLabel = formatLabel(item.label);
        const childrenCount = hasSections
          ? item.sections!.reduce((sum, s) => sum + s.items.length, 0)
          : item.children?.length || 0;

        // Determine dropdown dimensions and alignment
        const sectionCount = item.sections?.length || 0;
        let menuWidthClass = "w-[260px]";
        let alignPositionClass = "left-0";

        if (hasSections) {
          if (sectionCount >= 3) {
            menuWidthClass = "w-[820px]";
          } else if (sectionCount === 2) {
            menuWidthClass = "w-[560px]";
          } else {
            menuWidthClass = "w-[300px]";
          }

          // In our navbar, NavMenu is left-aligned starting at ~32px.
          // Sarees (index 0): left-0
          // Middle items: safe slight offset
          // Women (index 2): offset -left-40 to -left-44 so it remains within screen margins
          if (index === 0) {
            alignPositionClass = "left-0";
          } else if (index === 1) {
            alignPositionClass = "-left-16";
          } else {
            alignPositionClass = "-left-40 xl:-left-44";
          }
        } else {
          // Flat list fallback
          const isMultiCol = childrenCount > 8;
          menuWidthClass = isMultiCol ? "w-[520px]" : "w-[260px]";
          if (index === 0) {
            alignPositionClass = "left-0";
          } else if (index === 1) {
            alignPositionClass = isMultiCol ? "-left-16" : "left-0";
          } else {
            alignPositionClass = isMultiCol ? "-left-44" : "left-0";
          }
        }

        return (
          <div
            key={item.label}
            className="group relative"
            onMouseEnter={() => setOpen(item.label)}
            onMouseLeave={() => setOpen((cur) => (cur === item.label ? null : cur))}
          >
            <Link
              href={item.href}
              className="relative flex items-center gap-1 py-2 text-[17px] font-serif capitalize text-[#171717] transition-colors hover:text-[#7A0B2E]"
            >
              <span>{displayLabel}</span>
              {hasChildren && (
                <i
                  className={`ri-arrow-down-s-line text-sm leading-none text-[#171717] group-hover:text-[#7A0B2E] transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              )}
              <span
                className={`absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#7A0B2E] origin-left transition-transform duration-300 ${
                  isOpen ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>

            {/* Dropdown Mega Menu */}
            {hasChildren && (
              <div
                className={`absolute top-full z-50 pt-2.5 transition-all duration-200 ease-out ${alignPositionClass} ${
                  isOpen
                    ? "visible opacity-100 translate-y-0 pointer-events-auto"
                    : "invisible opacity-0 translate-y-1 pointer-events-none"
                }`}
              >
                {hasSections ? (
                  /* Multi-Section Real E-Commerce Mega Menu (Pattern A) */
                  <div
                    className={`${menuWidthClass} max-h-[calc(100vh-130px)] flex flex-col border border-[#7A0B2E]/15 bg-[#FDFAF7] shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-none overflow-hidden p-6`}
                  >
                    {/* Sections Columns */}
                    <div
                      className={`grid gap-6 ${
                        sectionCount >= 3
                          ? "grid-cols-3"
                          : sectionCount === 2
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {item.sections!.map((section) => (
                        <div key={section.title} className="flex flex-col">
                          {/* Column Header */}
                          <Link
                            href={section.href}
                            className="group/sec flex items-center justify-between pb-2 mb-3 border-b border-[#7A0B2E]/20 hover:border-[#7A0B2E] transition-colors"
                          >
                            <span className="font-serif font-bold text-sm tracking-wide text-[#7A0B2E] group-hover/sec:text-[#2D1F2F] transition-colors">
                              {section.title}
                            </span>
                            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#7A0B2E]/70 bg-[#F5EFE6] px-1.5 py-0.5 border border-[#7A0B2E]/10">
                              {section.items.length}
                            </span>
                          </Link>

                          {/* Section Items List */}
                          <div className="flex flex-col gap-1 max-h-[min(440px,calc(100vh-220px))] overflow-y-auto pr-1">
                            {section.items.map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className="group/item flex items-center justify-between text-[13px] font-serif text-[#2D1F2F] hover:text-[#7A0B2E] py-1 px-1.5 hover:bg-[#F5EFE6] transition-all rounded-none"
                              >
                                <span className="truncate group-hover/item:translate-x-0.5 transition-transform">
                                  {formatLabel(child.label)}
                                </span>
                                <i className="ri-arrow-right-s-line text-xs text-[#7A0B2E]/0 group-hover/item:text-[#7A0B2E]/80 transition-all shrink-0 ml-1" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-5 pt-3 border-t border-[#7A0B2E]/10 flex items-center justify-between bg-[#F5EFE6] -mx-6 -mb-6 px-6 py-2.5 shrink-0">
                      <span className="text-xs font-serif text-[#2D1F2F] italic">
                        Explore all {childrenCount} handcrafted varieties in {displayLabel}
                      </span>
                      <Link
                        href={item.href}
                        className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#2D1F2F] flex items-center gap-1.5 transition-colors"
                      >
                        <span>Explore All {displayLabel}</span>
                        <i className="ri-arrow-right-line text-sm" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Standard / Flat List Dropdown */
                  <div
                    className={`${menuWidthClass} max-h-[calc(100vh-130px)] flex flex-col border border-[#7A0B2E]/15 bg-[#FDFAF7] shadow-[0_16px_48px_rgba(0,0,0,0.12)] rounded-none overflow-hidden`}
                  >
                    <div className="px-5 py-3 border-b border-[#7A0B2E]/10 bg-[#FAF4F0] flex items-center justify-between">
                      <p className="text-sm font-serif font-bold capitalize text-[#2D1F2F] tracking-wide">
                        {displayLabel}
                      </p>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#7A0B2E]/70 bg-white/80 px-2 py-0.5 border border-[#7A0B2E]/10">
                        {childrenCount} Varieties
                      </span>
                    </div>

                    <div
                      className={`p-3 overflow-y-auto ${
                        childrenCount > 8
                          ? "grid grid-cols-2 gap-x-3 gap-y-1"
                          : "flex flex-col gap-0.5"
                      }`}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="group/item flex items-center justify-between px-3 py-1.5 text-[13px] font-serif text-[#2D1F2F] transition-all hover:text-[#7A0B2E] hover:bg-[#F5EFE6] rounded-none"
                        >
                          <span className="truncate group-hover/item:translate-x-0.5 transition-transform">
                            {formatLabel(child.label)}
                          </span>
                          <i className="ri-arrow-right-s-line text-xs text-[#7A0B2E]/0 group-hover/item:text-[#7A0B2E]/80 transition-all shrink-0 ml-1" />
                        </Link>
                      ))}
                    </div>

                    <Link
                      href={item.href}
                      className="flex items-center justify-between bg-[#F5EFE6] px-5 py-2.5 text-[11px] font-sans font-bold uppercase tracking-widest text-[#7A0B2E] transition-colors hover:bg-[#7A0B2E] hover:text-white border-t border-[#7A0B2E]/10 shrink-0"
                    >
                      <span>Explore All {displayLabel}</span>
                      <i className="ri-arrow-right-line text-sm" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
