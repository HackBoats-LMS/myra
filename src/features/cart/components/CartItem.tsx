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
    originalPrice?: number | null;
    name: string;
    images: string[];
    stockQuantity?: number;
    collection?: { name: string | null } | null;
  };
  variant?: { priceOffset: number; size?: string | null; color?: string | null } | null;
  flashPrice?: number;
  flashPercent?: number;
}

export default function CartItem({ item }: { item: CartLineItem }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const maxQty = item.product.stockQuantity ?? Infinity;
  const atStockLimit = item.quantity >= maxQty;

  // Effective unit price reflects the active flash sale, plus any variant offset.
  const unitPrice = (item.flashPrice ?? item.product.price) + (item.variant?.priceOffset || 0);
  const originalUnitPrice =
    (item.product.originalPrice && item.product.originalPrice > item.product.price
      ? item.product.originalPrice
      : item.product.price) + (item.variant?.priceOffset || 0);

  const handleUpdate = async (newQty: number) => {
    if (newQty > maxQty) return;
    setIsUpdating(true);
    await updateCartQuantity(item.product.id, newQty, item.variantId ?? undefined);
    router.refresh();
    setIsUpdating(false);
  };

  return (
    <div className="flex gap-6 py-6 border-b border-[#7A0B2E]/20 last:border-0 relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-[#F5EFE6]/70 flex items-center justify-center z-10">
          <i className="ri-loader-4-line animate-spin text-2xl text-[#7A0B2E]" />
        </div>
      )}
      
      <Link href={`/products/${item.product.slug}`} className="relative w-24 h-32 md:w-32 md:h-40 bg-[#F5EFE6] flex-shrink-0 rounded-none overflow-hidden border border-[#7A0B2E]/20 hover:opacity-90 transition-opacity">
        {item.product.images[0] && (
          <Image src={item.product.images[0]} alt={item.product.name} fill quality={100} sizes="(max-width: 768px) 96px, 128px" className="object-cover" />
        )}
      </Link>
      
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div>
            <Link href={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
              <h3 className="text-base font-serif font-bold text-[#2D1F2F]">{item.product.name}</h3>
            </Link>
            {item.product.collection && (
              <p className="text-xs text-[#7A0B2E] mt-1 uppercase tracking-widest">{item.product.collection.name}</p>
            )}
            {item.variant && (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2 bg-[#F5EFE6] px-2 py-1 inline-block rounded-none border border-[#7A0B2E]/20">
                {[item.variant.size, item.variant.color].filter(Boolean).join(" - ")}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {item.flashPercent ? (
              <span className="text-[9px] font-bold uppercase tracking-widest bg-[#7A0B2E] text-white px-1.5 py-0.5 rounded-none">
                Flash {item.flashPercent}% OFF
              </span>
            ) : null}
            <p className="text-base font-bold text-[#2D1F2F]">
              Rs. {(unitPrice * item.quantity).toLocaleString('en-IN')}
            </p>
            {item.flashPrice != null && item.flashPrice < originalUnitPrice && (
              <p className="text-xs text-gray-400 line-through">
                Rs. {(originalUnitPrice * item.quantity).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center w-24 h-8 border border-[#7A0B2E]/30 rounded-none bg-white">
              <button onClick={() => handleUpdate(item.quantity - 1)} disabled={isUpdating || item.quantity <= 1} className="w-1/3 h-full text-[#2D1F2F] hover:text-[#7A0B2E] transition-colors flex items-center justify-center disabled:opacity-30">
                <i className="ri-subtract-line text-sm" />
              </button>
              <div className="w-1/3 h-full flex items-center justify-center text-xs font-bold text-[#2D1F2F]">
                {item.quantity}
              </div>
              <button onClick={() => handleUpdate(item.quantity + 1)} disabled={isUpdating || atStockLimit} className="w-1/3 h-full text-[#2D1F2F] hover:text-[#7A0B2E] transition-colors flex items-center justify-center disabled:opacity-30">
                <i className="ri-add-line text-sm" />
              </button>
            </div>
            {item.quantity > maxQty ? (
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 border border-red-100">
                Limit: {maxQty}
              </span>
            ) : atStockLimit && item.product.stockQuantity != null ? (
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 border border-red-100">
                Only {item.product.stockQuantity} left
              </span>
            ) : null}
          </div>
          
          <button onClick={() => handleUpdate(0)} className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest">
            <i className="ri-delete-bin-line text-base" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
