"use client";
import { useState } from "react";
import Link from "next/link";
import type { NavLink } from "@/lib/navigation";

export default function NavMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
      {links.map((item) => {
        const isOpen = open === item.label;
        return (
          <div
            key={item.label}
            className="group relative"
            onMouseEnter={() => setOpen(item.label)}
            onMouseLeave={() => setOpen((cur) => (cur === item.label ? null : cur))}
          >
            <Link
              href={item.href}
              className="relative flex items-center gap-1.5 px-2 lg:px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] transition-colors hover:text-[#B6925B]"
            >
              {item.label}
              <i
                className={`ri-arrow-down-s-line text-sm leading-none text-[#B6925B] transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
              <span
                className={`absolute left-2 lg:left-4 right-2 lg:right-4 bottom-0 h-[2px] bg-[#B6925B] origin-left transition-transform duration-300 ${
                  isOpen ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>

            {/* Dropdown */}
            <div
              className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 transition-all duration-300 ${
                isOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2"
              }`}
            >
              <div className="w-[260px] border border-[#B6925B]/15 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] py-3">
                <p className="px-5 pb-3 text-lg font-serif text-[#4A3B2C] border-b border-[#B6925B]/10">
                  {item.label}
                </p>
                <div className="py-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className="relative block px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] transition-colors hover:text-[#B6925B]"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
                <Link
                  href={item.href}
                  className="block bg-[#FAFAFA] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] transition-colors hover:bg-[#B6925B] hover:text-white"
                >
                  View All {item.label} <i className="ri-arrow-right-line align-middle" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}