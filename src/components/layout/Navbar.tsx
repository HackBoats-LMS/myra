"use client";
import Link from "next/link";
import CartButton from "./CartButton";
import WishlistButton from "./WishlistIconButton";
import NavMenu from "./NavMenu";
import { NAV_LINKS, type NavLink } from "@/lib/navigation";
import { ProfileIcon } from "@/components/icons/NavIcons";
import MyraLogo from "@/components/shared/MyraLogo";

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  navLinks?: NavLink[];
}

export default function Navbar({ cartCount, wishlistCount, isLoggedIn, navLinks = NAV_LINKS }: NavbarProps) {
  return (
    <nav className="w-full bg-white border-b border-[#7A0B2E]/20 flex items-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-3 relative z-50">
      {/* Logo (left) */}
      <div className="flex-1 flex items-center justify-start">
        <Link href="/" className="flex items-center">
          <MyraLogo
            className="py-1 px-2 md:py-2 md:px-4 h-10 sm:h-12 md:h-14 lg:h-16 xl:h-[72px] 2xl:h-[76px] w-auto transition-all"
          />
        </Link>
      </div>

      {/* Desktop Navigation with Dropdowns (centered) */}
      <NavMenu links={navLinks} />

      {/* Action Icons (Account, Cart, Wishlist) */}
      <div className="flex-1 flex items-center justify-end gap-3.5 sm:gap-5 md:gap-6 lg:gap-8">
        <Link
          href={isLoggedIn ? "/account" : "/login"}
          className="flex flex-col items-center justify-center gap-0.5 text-[#171717] hover:text-[#7A0B2E] transition-colors group"
        >
          <div className="relative flex items-center justify-center h-[24px] sm:h-[26px] md:h-[28px] lg:h-[22px]">
            <ProfileIcon className="w-[20px] h-[22px] sm:w-[22px] sm:h-[24px] md:w-[24px] md:h-[26px] lg:w-[19px] lg:h-[21px] group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[11px] font-serif lowercase tracking-normal text-[#171717] group-hover:text-[#7A0B2E] leading-none mt-0.5 lg:mt-0">account</span>
        </Link>

        <CartButton cartCount={cartCount} />

        <WishlistButton wishlistCount={wishlistCount} />
      </div>
    </nav>
  );
}
