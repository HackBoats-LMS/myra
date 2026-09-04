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

export default function HeaderController({ cartCount: initialCart, wishlistCount: initialWishlist, isLoggedIn: initialAuth, navLinks }: HeaderControllerProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/collections") || pathname.startsWith("/search");

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
          <CatalogToolbar />
        </Suspense>
      )}
    </>
  );
}
