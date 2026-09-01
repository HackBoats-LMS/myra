"use client";
import { useCartDrawer } from "@/context/CartContext";
import { CartIcon } from "@/components/icons/NavIcons";

export default function CartButton({ cartCount }: { cartCount: number }) {
  const { openCart } = useCartDrawer();

  return (
    <button
      onClick={openCart}
      className="flex flex-col items-center justify-center gap-0.5 text-[#171717] hover:text-[#B6925B] transition-colors relative focus:outline-none group cursor-pointer"
      aria-label={`Cart with ${cartCount} items`}
    >
      <div className="relative flex items-center justify-center h-[24px] sm:h-[26px] md:h-[28px] lg:h-[22px]">
        <CartIcon className="w-[20px] h-[22px] sm:w-[22px] sm:h-[24px] md:w-[24px] md:h-[26px] lg:w-[19px] lg:h-[21px] group-hover:scale-105 transition-transform" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[16px] sm:min-w-[18px] lg:min-w-[16px] h-4 sm:h-[18px] lg:h-4 px-1 bg-[#4A3B2C] text-white text-[9px] sm:text-[10px] lg:text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </div>
      <span className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[11px] font-serif lowercase tracking-normal text-[#171717] group-hover:text-[#B6925B] leading-none mt-0.5 lg:mt-0">cart</span>
    </button>
  );
}
