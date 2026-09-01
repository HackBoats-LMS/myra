"use client";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Navbar from "./Navbar";
import MinimalTopbar from "./MinimalTopbar";
import CatalogToolbar from "./CatalogToolbar";

import type { NavLink } from "@/lib/navigation";

interface HeaderControllerProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  navLinks?: NavLink[];
}

export default function HeaderController({ cartCount, wishlistCount, isLoggedIn, navLinks }: HeaderControllerProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/collections") || pathname.startsWith("/search");

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
