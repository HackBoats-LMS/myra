"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import MinimalTopbar from "./MinimalTopbar";
import CatalogToolbar from "./CatalogToolbar";

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