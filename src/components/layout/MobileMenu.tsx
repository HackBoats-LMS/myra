"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartDrawer } from "@/context/CartContext";

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
  const { openCart } = useCartDrawer();

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
        className="p-2 text-[#4A3B2C] hover:text-[#B6925B] transition-colors flex items-center justify-center"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <i className="ri-close-line text-2xl leading-none" />
        ) : (
          <i className="ri-menu-line text-2xl leading-none" />
        )}
      </button>

      {/* Slide-down panel */}
      <div
        className={`
          fixed left-0 right-0 top-[65px] bg-white border-b border-[#B6925B]/20 shadow-lg z-40
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
              className="w-full bg-[#FAFAFA] border border-[#B6925B]/20 rounded-none py-2 pl-4 pr-10 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#B6925B] focus:bg-white focus:ring-1 focus:ring-[#B6925B] transition-all text-[#4A3B2C] placeholder-gray-400"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B6925B] hover:text-[#4A3B2C] flex items-center justify-center">
              <i className="ri-search-line text-base leading-none" />
            </button>
          </form>

          {/* Shop links */}
          <p className="text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mt-2 mb-1">
            Shop
          </p>
          <Link
            href="/collections"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 border-b border-[#B6925B]/10 transition-colors"
          >
            All Products
          </Link>
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 border-b border-[#B6925B]/10 transition-colors"
            >
              {c.name}
            </Link>
          ))}

          {/* Account links */}
          <p className="text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mt-4 mb-1">
            Account
          </p>
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 border-b border-[#B6925B]/10 transition-colors"
          >
            <i className="ri-user-line text-[#B6925B] text-base leading-none" />
            {isLoggedIn ? "My Account" : "Log In"}
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              openCart();
            }}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 border-b border-[#B6925B]/10 transition-colors w-full text-left"
          >
            <div className="relative flex items-center">
              <i className="ri-shopping-bag-line text-[#B6925B] text-base leading-none" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-[#4A3B2C] text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>
            Cart{cartCount > 0 && ` (${cartCount})`}
          </button>
          <Link
            href="/wishlist"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 transition-colors"
          >
            <i className="ri-heart-line text-[#B6925B] text-base leading-none" />
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
