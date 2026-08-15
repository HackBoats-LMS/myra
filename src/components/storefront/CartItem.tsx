"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { updateCartQuantity } from "@/actions/cart";
import { useRouter } from "next/navigation";

interface CartLineItem {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  product: {
    id: string;
    slug: string;
    price: number;
    name: string;
    images: string[];
    stockQuantity?: number;
    collection?: { name: string | null } | null;
  };
  variant?: { priceOffset: number; size?: string | null; color?: string | null } | null;
}

export default function CartItem({ item }: { item: CartLineItem }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const maxQty = item.product.stockQuantity ?? Infinity;
  const atStockLimit = item.quantity >= maxQty;

  const handleUpdate = async (newQty: number) => {
    if (newQty > maxQty) return;
    setIsUpdating(true);
    await updateCartQuantity(item.product.id, newQty, item.variantId ?? undefined);
    router.refresh();
    setIsUpdating(false);
  };

  return (
    <div className="flex gap-6 py-6 border-b border-[#B6925B]/20 last:border-0 relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-[#FAFAFA]/70 flex items-center justify-center z-10">
          <i className="ri-loader-4-line animate-spin text-2xl text-[#B6925B]" />
        </div>
      )}
      
      <Link href={`/products/${item.product.slug}`} className="relative w-24 h-32 md:w-32 md:h-40 bg-[#FAFAFA] flex-shrink-0 rounded-none overflow-hidden border border-[#B6925B]/20 hover:opacity-90 transition-opacity">
        {item.product.images[0] && (
          <Image src={item.product.images[0]} alt={item.product.name} fill quality={100} sizes="(max-width: 768px) 96px, 128px" className="object-cover" />
        )}
      </Link>
      
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
              <h3 className="text-base font-serif font-bold text-[#4A3B2C]">{item.product.name}</h3>
            </Link>
            {item.product.collection && (
              <p className="text-xs text-[#B6925B] mt-1 uppercase tracking-widest">{item.product.collection.name}</p>
            )}
            {item.variant && (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2 bg-[#FAFAFA] px-2 py-1 inline-block rounded-none border border-[#B6925B]/20">
                {[item.variant.size, item.variant.color].filter(Boolean).join(" - ")}
              </p>
            )}
          </div>
          <p className="text-base font-bold text-[#4A3B2C]">
            Rs. {((item.product.price + (item.variant?.priceOffset || 0)) * item.quantity).toLocaleString('en-IN')}
          </p>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center w-24 h-8 border border-[#B6925B]/30 rounded-none bg-white">
            <button onClick={() => handleUpdate(item.quantity - 1)} disabled={isUpdating || item.quantity <= 1} className="w-1/3 h-full text-[#4A3B2C] hover:text-[#B6925B] transition-colors flex items-center justify-center disabled:opacity-30">
              <i className="ri-subtract-line text-sm" />
            </button>
            <div className="w-1/3 h-full flex items-center justify-center text-xs font-bold text-[#4A3B2C]">
              {item.quantity}
            </div>
            <button onClick={() => handleUpdate(item.quantity + 1)} disabled={isUpdating || atStockLimit} className="w-1/3 h-full text-[#4A3B2C] hover:text-[#B6925B] transition-colors flex items-center justify-center disabled:opacity-30">
              <i className="ri-add-line text-sm" />
            </button>
          </div>
          {atStockLimit && item.product.stockQuantity != null && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-600">
              Only {item.product.stockQuantity} in stock
            </span>
          )}
          
          <button onClick={() => handleUpdate(0)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
            <i className="ri-delete-bin-line text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}
