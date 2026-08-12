"use client";
import { useState } from "react";
import Image from "next/image";
import { updateCartQuantity } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { ArrowPathIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface CartLineItem {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  product: {
    id: string;
    price: number;
    name: string;
    images: string[];
    collection?: { name: string | null } | null;
  };
  variant?: { priceOffset: number; size?: string | null; color?: string | null } | null;
}

export default function CartItem({ item }: { item: CartLineItem }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newQty: number) => {
    setIsUpdating(true);
    await updateCartQuantity(item.product.id, newQty, item.variantId ?? undefined);
    router.refresh();
    setIsUpdating(false);
  };

  return (
    <div className="flex gap-6 py-6 border-b border-[#B6925B]/20 last:border-0 relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-[#FAFAFA]/70 flex items-center justify-center z-10">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-[#B6925B]" />
        </div>
      )}
      
      <div className="relative w-24 h-32 md:w-32 md:h-40 bg-gray-50 flex-shrink-0 rounded-sm overflow-hidden border border-gray-100">
        {item.product.images[0] && (
          <Image src={item.product.images[0]} alt={item.product.name} fill sizes="(max-width: 768px) 96px, 128px" className="object-cover" />
        )}
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-serif font-bold text-[#4A3B2C]">{item.product.name}</h3>
            {item.product.collection && (
              <p className="text-xs text-[#B6925B] mt-1 uppercase tracking-widest">{item.product.collection.name}</p>
            )}
            {item.variant && (
              <p className="text-xs text-gray-500 mt-2 font-medium bg-gray-100 px-2 py-1 inline-block rounded-sm">
                {[item.variant.size, item.variant.color].filter(Boolean).join(" - ")}
              </p>
            )}
          </div>
          <p className="text-base font-bold text-[#4A3B2C]">
            Rs. {((item.product.price + (item.variant?.priceOffset || 0)) * item.quantity).toLocaleString('en-IN')}
          </p>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center w-24 h-8 border border-gray-200 rounded-sm">
            <button onClick={() => handleUpdate(item.quantity - 1)} className="w-1/3 h-full text-gray-500 hover:text-[#B6925B] transition-colors flex items-center justify-center">
              <MinusIcon className="w-3 h-3" />
            </button>
            <div className="w-1/3 h-full flex items-center justify-center text-xs font-medium text-[#4A3B2C]">
              {item.quantity}
            </div>
            <button onClick={() => handleUpdate(item.quantity + 1)} className="w-1/3 h-full text-gray-500 hover:text-[#B6925B] transition-colors flex items-center justify-center">
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
          
          <button onClick={() => handleUpdate(0)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
