"use client";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import CartButton from "./CartButton";
import WishlistButton from "./WishlistButton";
import { NAV_LINKS } from "@/lib/navigation";

// Load the mobile slide-out menu only on the client when the hamburger is tapped.
const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });

interface MinimalTopbarProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
}

export default function MinimalTopbar({ cartCount, wishlistCount, isLoggedIn }: MinimalTopbarProps) {
  return (
    <nav className="w-full bg-white border-b border-[#B6925B]/20 flex items-center px-4 md:px-6 lg:px-8 py-3 relative z-50">
      {/* Logo (left) */}
      <div className="flex-1 flex items-center justify-start">
        <Link href="/" className="flex items-center">
          <Image
            src="/displaypics/malllogo.png"
            alt="Myra Shopping Mall Logo"
            width={150}
            height={50}
            priority
            className="object-contain h-12 md:h-14 w-auto"
          />
        </Link>
      </div>

      {/* Account / Cart / Wishlist (right) */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link
          href={isLoggedIn ? "/account" : "/login"}
          className="flex flex-col items-center gap-1 text-[#4A3B2C] hover:text-[#B6925B] transition-colors"
        >
          <i className="ri-user-line text-[22px] leading-none stroke-[1.5]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">account</span>
        </Link>

        <CartButton cartCount={cartCount} />

        <WishlistButton wishlistCount={wishlistCount} />
      </div>

      {/* Mobile Hamburger Menu */}
      <MobileMenu links={NAV_LINKS} isLoggedIn={isLoggedIn} cartCount={cartCount} wishlistCount={wishlistCount} />
    </nav>
  );
}