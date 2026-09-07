"use client";
import Link from "next/link";
import CartButton from "./CartButton";
import WishlistButton from "./WishlistIconButton";
import NavMenu from "./NavMenu";
import { NAV_LINKS, type NavLink } from "@/lib/navigation";
import { ProfileIcon, WhatsAppIcon } from "@/components/icons/NavIcons";
import MyraLogo from "@/components/shared/MyraLogo";

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
  navLinks?: NavLink[];
}

export default function Navbar({ cartCount, wishlistCount, isLoggedIn, navLinks = NAV_LINKS }: NavbarProps) {
  return (
    <nav className="w-full bg-[#F7F0EE] border-b border-[#7A0B2E]/15 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 lg:py-3 xl:min-h-[88px] 2xl:min-h-[92px] relative z-50">
      {/* Left side: Logo on smaller screens (< xl), Desktop NavMenu on larger screens (xl+) */}
      <div className="flex items-center justify-start">
        {/* Mobile/Tablet Logo (left) */}
        <div className="xl:hidden flex items-center">
          <Link href="/" className="flex items-center">
            <MyraLogo
              className="py-1 px-1 sm:px-2 md:py-2 md:px-4 h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-all"
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden xl:flex items-center">
          <NavMenu links={navLinks} />
        </div>
      </div>

      {/* Center Logo on larger screens (xl+) - absolute 50% dead center */}
      <div className="hidden xl:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <Link href="/" className="flex items-center">
          <MyraLogo
            className="py-1 px-2 md:py-2 md:px-4 xl:h-[72px] 2xl:h-[76px] w-auto transition-all"
          />
        </Link>
      </div>

      {/* Right side: Action Icons (WhatsApp, Account, Cart, Wishlist) */}
      <div className="flex items-center justify-end gap-3.5 sm:gap-5 md:gap-6 lg:gap-8">
        <a
          href="https://wa.me/919177751481"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 text-[#171717] hover:text-[#25D366] transition-colors group cursor-pointer"
          aria-label="WhatsApp"
        >
          <div className="relative flex items-center justify-center h-[24px] sm:h-[26px] md:h-[28px] lg:h-[22px]">
            <WhatsAppIcon className="w-[19px] h-[21px] sm:w-[21px] sm:h-[23px] md:w-[23px] md:h-[25px] lg:w-[18px] lg:h-[20px] group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[11px] font-serif tracking-normal text-[#171717] group-hover:text-[#25D366] leading-none mt-0.5 lg:mt-0">WhatsApp</span>
        </a>

        <Link
          href={isLoggedIn ? "/account" : "/login"}
          className="flex flex-col items-center justify-center gap-0.5 text-[#171717] hover:text-[#7A0B2E] transition-colors group"
        >
          <div className="relative flex items-center justify-center h-[24px] sm:h-[26px] md:h-[28px] lg:h-[22px]">
            <ProfileIcon className="w-[20px] h-[22px] sm:w-[22px] sm:h-[24px] md:w-[24px] md:h-[26px] lg:w-[19px] lg:h-[21px] group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[11px] font-serif tracking-normal text-[#171717] group-hover:text-[#7A0B2E] leading-none mt-0.5 lg:mt-0">Account</span>
        </Link>

        <CartButton cartCount={cartCount} />

        <WishlistButton wishlistCount={wishlistCount} />
      </div>
    </nav>
  );
}
