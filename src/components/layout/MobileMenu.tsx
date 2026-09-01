"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartDrawer } from "@/context/CartContext";
import { useWishlistDrawer } from "@/context/WishlistContext";
import type { NavLink } from "@/lib/navigation";

interface MobileMenuProps {
  links: NavLink[];
  isLoggedIn: boolean;
  cartCount: number;
  wishlistCount?: number;
}

export default function MobileMenu({ links, isLoggedIn, cartCount, wishlistCount = 0 }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openCart } = useCartDrawer();
  const { openWishlist } = useWishlistDrawer();

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
        className="p-1 sm:p-1.5 text-[#171717] hover:text-[#B6925B] transition-colors flex items-center justify-center cursor-pointer"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <i className="ri-close-line text-xl sm:text-2xl leading-none" />
        ) : (
          <i className="ri-menu-line text-xl sm:text-2xl leading-none" />
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
          {links.map((link) => {
            const isOpenSection = openSection === link.label;
            return (
              <div key={link.label} className="border-b border-[#B6925B]/10">
                <div className="flex items-center justify-between">
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 transition-colors"
                  >
                    {link.label}
                  </Link>
                  <button
                    onClick={() => setOpenSection(isOpenSection ? null : link.label)}
                    aria-expanded={isOpenSection}
                    className="p-2 text-[#B6925B] hover:text-[#4A3B2C] transition-colors flex items-center justify-center"
                  >
                    <i className={`ri-${isOpenSection ? "subtract" : "add"}-line text-base leading-none`} />
                  </button>
                </div>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpenSection ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-3 pb-3 flex flex-col gap-1 border-l border-[#B6925B]/20 ml-1">
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] py-2 transition-colors"
                    >
                      View All {link.label}
                    </Link>
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={() => setIsOpen(false)}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-2 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

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
          <button
            onClick={() => {
              setIsOpen(false);
              openWishlist();
            }}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] py-3 transition-colors w-full text-left"
          >
            <i className="ri-heart-line text-[#B6925B] text-base leading-none" />
            Wishlist{wishlistCount > 0 && ` (${wishlistCount})`}
          </button>
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
