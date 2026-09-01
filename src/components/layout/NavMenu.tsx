"use client";
import { useState } from "react";
import Link from "next/link";
import type { NavLink } from "@/lib/navigation";

export default function NavMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="hidden xl:flex items-center gap-6 lg:gap-8">
      {links.map((item) => {
        const isOpen = open === item.label;
        const hasChildren = item.children && item.children.length > 0;
        const displayLabel = item.label.toLowerCase();

        return (
          <div
            key={item.label}
            className="group relative"
            onMouseEnter={() => setOpen(item.label)}
            onMouseLeave={() => setOpen((cur) => (cur === item.label ? null : cur))}
          >
            <Link
              href={item.href}
              className="relative flex items-center gap-1 py-2 text-[17px] font-serif lowercase text-[#171717] transition-colors hover:text-[#B6925B]"
            >
              <span>{displayLabel}</span>
              {hasChildren && (
                <i
                  className={`ri-arrow-down-s-line text-sm leading-none text-[#171717] group-hover:text-[#B6925B] transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                    }`}
                />
              )}
              <span
                className={`absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#B6925B] origin-left transition-transform duration-300 ${isOpen ? "scale-x-100" : "scale-x-0"
                  }`}
              />
            </Link>

            {/* Dropdown */}
            {hasChildren && (
              <div
                className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition-all duration-300 ${isOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2"
                  }`}
              >
                <div className="w-[240px] border border-[#B6925B]/20 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] py-3 rounded-sm">
                  <p className="px-5 pb-2.5 text-base font-serif lowercase text-[#171717] border-b border-[#B6925B]/10 font-semibold">
                    {displayLabel}
                  </p>
                  <div className="py-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="relative block px-5 py-2 text-[13px] font-serif lowercase text-[#4A3B2C] transition-colors hover:text-[#B6925B] hover:bg-[#FAFAFA]"
                      >
                        {child.label.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={item.href}
                    className="block bg-[#FAFAFA] px-5 py-2.5 text-[12px] font-serif lowercase text-[#B6925B] transition-colors hover:bg-[#B6925B] hover:text-white mt-1 border-t border-[#B6925B]/10"
                  >
                    view all {displayLabel} <i className="ri-arrow-right-line align-middle ml-1" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
