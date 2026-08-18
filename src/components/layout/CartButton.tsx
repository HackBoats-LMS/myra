"use client";
import { useCartDrawer } from "@/context/CartContext";

export default function CartButton({ cartCount }: { cartCount: number }) {
  const { openCart } = useCartDrawer();

  return (
    <button
      onClick={openCart}
      className="flex flex-col items-center gap-1 text-[#4A3B2C] hover:text-[#B6925B] transition-colors relative focus:outline-none"
    >
      <div className="relative">
        <i className="ri-shopping-bag-line text-[22px] leading-none stroke-[1.5]" />
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-[#4A3B2C] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {cartCount}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">bag</span>
    </button>
  );
}
