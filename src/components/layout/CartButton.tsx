"use client";
import { useCartDrawer } from "@/context/CartContext";
import { CartIcon } from "@/components/icons/NavIcons";

export default function CartButton({ cartCount: _ignoredCartCount }: { cartCount: number }) {
  const { openCart, cartCount } = useCartDrawer();

  return (
    <button
      onClick={openCart}
      className="flex flex-col items-center justify-center gap-0.5 text-[#171717] hover:text-[#7A0B2E] transition-colors relative focus:outline-none group cursor-pointer"
      aria-label={`Cart with ${cartCount} items`}
    >
      <div className="relative flex items-center justify-center h-[24px] sm:h-[26px] md:h-[28px] lg:h-[22px]">
        <CartIcon className="w-[18px] h-[20px] sm:w-[20px] sm:h-[22px] md:w-[22px] md:h-[24px] lg:w-[17px] lg:h-[19px] group-hover:scale-105 transition-transform" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[16px] sm:min-w-[18px] lg:min-w-[16px] h-4 sm:h-[18px] lg:h-4 px-1 bg-[#2D1F2F] text-white text-[9px] sm:text-[10px] lg:text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </div>
      <span className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[11px] font-serif lowercase tracking-normal text-[#171717] group-hover:text-[#7A0B2E] leading-none mt-0.5 lg:mt-0">cart</span>
    </button>
  );
}
