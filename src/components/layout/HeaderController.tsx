"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Navbar from "./Navbar";
import MinimalTopbar from "./MinimalTopbar";
import CatalogToolbar from "./CatalogToolbar";
import { useCartDrawer } from "@/context/CartContext";

import type { NavLink } from "@/lib/navigation";

interface HeaderControllerProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  navLinks?: NavLink[];
}

/**
 * Resolves the correct "back" href for the arrow button on catalog pages.
 *
 * Nav tree has up to 3 levels:
 *   Top-level  (NavLink)    e.g. /collections/sarees
 *   Section    (NavSection) e.g. /collections/pure-pattu-silk
 *   Item       (NavChild)   e.g. /collections/kanchi-pattu-sarees
 *
 * Rules:
 *   - Item  (grandchild)    → its Section href
 *   - Section / flat child  → its Top-level href
 *   - Top-level             → home "/"
 *   - Not found in nav      → home "/" (new-arrivals, best-sellers, search, etc.)
 *   - navLinks empty/null   → home "/"
 */
function resolveBackHref(pathname: string, navLinks: NavLink[] | undefined): string {
  if (!navLinks || navLinks.length === 0) return "/";

  // Strip query string for matching
  const cleanPath = pathname.split("?")[0];

  for (const topItem of navLinks) {
    const topHref = topItem.href.split("?")[0];

    // Is the current page a top-level item itself?
    if (topHref === cleanPath) return "/";

    // Has sections (3-tier: top → section → items)
    if (topItem.sections && topItem.sections.length > 0) {
      for (const section of topItem.sections) {
        const sectionHref = section.href.split("?")[0];

        // Is current page the section itself?
        if (sectionHref === cleanPath) return topHref;

        // Is current page one of the section's items?
        for (const item of section.items) {
          if (item.href.split("?")[0] === cleanPath) return sectionHref;
        }
      }
    }

    // Has flat children (2-tier: top → children)
    if (topItem.children && topItem.children.length > 0) {
      for (const child of topItem.children) {
        if (child.href.split("?")[0] === cleanPath) return topHref;
      }
    }
  }

  // Not found in nav tree — go home (handles new-arrivals, best-sellers, /search, etc.)
  return "/";
}

export default function HeaderController({ cartCount: initialCart, wishlistCount: initialWishlist, isLoggedIn: initialAuth, navLinks }: HeaderControllerProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/collections") || pathname.startsWith("/search");

  const backHref = resolveBackHref(pathname, navLinks);

  const [cartCount, setCartCountState] = useState(initialCart);
  const [wishlistCount, setWishlistCount] = useState(initialWishlist);
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuth);
  
  const { setCartCount: setGlobalCartCount } = useCartDrawer();

  useEffect(() => {
    fetch("/api/user/state")
      .then(res => res.json())
      .then(data => {
        setCartCountState(data.cartCount);
        setWishlistCount(data.wishlistCount);
        setIsLoggedIn(data.isLoggedIn);
        setGlobalCartCount(data.cartCount);
      })
      .catch(err => console.error("Failed to hydrate user state", err));
  }, [setGlobalCartCount]);

  return (
    <>
      {isHome ? (
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} navLinks={navLinks} />
      ) : (
        <MinimalTopbar cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} />
      )}
      {isCatalog && (
        <Suspense fallback={null}>
          <CatalogToolbar backHref={backHref} navLinks={navLinks} />
        </Suspense>
      )}
    </>
  );
}
