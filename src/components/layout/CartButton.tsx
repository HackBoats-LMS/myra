"use client";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useCartDrawer } from "@/context/CartContext";

export default function CartButton({ cartCount }: { cartCount: number }) {
  const { openCart } = useCartDrawer();

  return (
    <button
      onClick={openCart}
      className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors relative focus:outline-none"
    >
      <div className="relative">
        <ShoppingBagIcon className="w-[22px] h-[22px] stroke-[1.5]" />
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-[#B03138] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {cartCount}
          </span>
        )}
      </div>
      <span className="text-[10px] capitalize text-gray-600">bag</span>
    </button>
  );
}
