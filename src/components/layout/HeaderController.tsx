"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MinimalTopbar from "@/components/layout/MinimalTopbar";
import CatalogToolbar from "@/components/layout/CatalogToolbar";

interface HeaderControllerProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
}

export default function HeaderController({ cartCount, wishlistCount, isLoggedIn }: HeaderControllerProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/collections") || pathname.startsWith("/search");

  return (
    <>
      {isHome ? (
        <Navbar cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} />
      ) : (
        <MinimalTopbar cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} />
      )}
      {isCatalog && <CatalogToolbar />}
    </>
  );
}