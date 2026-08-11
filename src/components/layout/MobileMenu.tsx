"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, UserIcon, ShoppingBagIcon, HeartIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface MobileMenuProps {
  collections: Collection[];
  isLoggedIn: boolean;
  cartCount: number;
}

export default function MobileMenu({ collections, isLoggedIn, cartCount }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <div className="md:hidden" ref={menuRef}>
      {/* Hamburger trigger */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Slide-down panel */}
      <div
        className={`
          fixed left-0 right-0 top-[65px] bg-white border-b border-gray-100 shadow-lg z-40
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        `}
      >
        <nav className="flex flex-col px-6 py-4 gap-1">
          {/* Mobile Search Bar */}
          <form action="/search" method="GET" onSubmit={() => setIsOpen(false)} className="relative w-full mb-4 mt-2">
            <input
              name="q"
              placeholder="Search products..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-[#0D3B66] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </form>

          {/* Shop links */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-2 mb-1">
            Shop
          </p>
          <Link
            href="/collections"
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 py-2.5 border-b border-gray-50 transition-colors"
          >
            All Products
          </Link>
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 py-2.5 border-b border-gray-50 transition-colors capitalize"
            >
              {c.name.toLowerCase()}
            </Link>
          ))}

          {/* Account links */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-4 mb-1">
            Account
          </p>
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-gray-900 py-2.5 border-b border-gray-50 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            {isLoggedIn ? "My Account" : "Log In"}
          </Link>
          <Link
            href="/cart"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-gray-900 py-2.5 border-b border-gray-50 transition-colors"
          >
            <div className="relative">
              <ShoppingBagIcon className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-[#B03138] text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            Cart{cartCount > 0 && ` (${cartCount})`}
          </Link>
          <Link
            href="/wishlist"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-gray-900 py-2.5 transition-colors"
          >
            <HeartIcon className="w-4 h-4" />
            Wishlist
          </Link>
        </nav>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[65px] bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
