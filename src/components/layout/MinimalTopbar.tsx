"use client";
import Link from "next/link";
import Image from "next/image";
import CartButton from "./CartButton";
import WishlistButton from "./WishlistIconButton";
import { ProfileIcon } from "@/components/icons/NavIcons";

import logoPic from "../../../public/displaypics/myralogo.png";

interface MinimalTopbarProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
}

export default function MinimalTopbar({ cartCount, wishlistCount, isLoggedIn }: MinimalTopbarProps) {
  return (
    <nav className="w-full bg-white border-b border-[#B6925B]/20 flex items-center px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 relative z-50">
      {/* Logo (left) */}
      <div className="flex-1 flex items-center justify-start">
        <Link href="/" className="flex items-center">
          <Image
            src={logoPic}
            alt="Myra Shopping Mall Logo"
            width={180}
            height={60}
            priority
            className="object-contain h-7 sm:h-8 md:h-11 lg:h-12 xl:h-14 w-auto transition-all"
          />
        </Link>
      </div>

      {/* Action Icons (Account, Cart, Wishlist) */}
      <div className="flex items-center gap-3.5 sm:gap-5 md:gap-6 lg:gap-8">
        <Link
          href={isLoggedIn ? "/account" : "/login"}
          className="flex flex-col items-center justify-center gap-0.5 text-[#171717] hover:text-[#B6925B] transition-colors group"
        >
          <div className="relative flex items-center justify-center h-[20px] sm:h-[22px]">
            <ProfileIcon className="w-[17px] h-[19px] sm:w-[19px] sm:h-[21px] group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-serif lowercase tracking-normal text-[#171717] group-hover:text-[#B6925B] leading-none">account</span>
        </Link>

        <CartButton cartCount={cartCount} />

        <WishlistButton wishlistCount={wishlistCount} />
      </div>
    </nav>
  );
}
