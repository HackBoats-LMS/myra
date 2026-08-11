"use client";
import { useState } from "react";
import Image from "next/image";
import { updateCartQuantity } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { ArrowPathIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function CartItem({ item }: { item: any }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newQty: number) => {
    setIsUpdating(true);
    await updateCartQuantity(item.product.id, newQty);
    router.refresh();
    setIsUpdating(false);
  };

  return (
    <div className="flex gap-6 py-6 border-b border-gray-100 last:border-0 relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      <div className="relative w-24 h-32 md:w-32 md:h-40 bg-gray-50 flex-shrink-0 rounded overflow-hidden">
        {item.product.images[0] && (
          <Image src={item.product.images[0]} alt={item.product.name} fill sizes="(max-width: 768px) 96px, 128px" className="object-cover" />
        )}
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{item.product.name}</h3>
            {item.product.collection && (
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{item.product.collection.name}</p>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900">₹{(item.product.price * item.quantity).toFixed(2)}</p>
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border border-gray-200 rounded">
            <button onClick={() => handleUpdate(item.quantity - 1)} className="p-2 text-gray-500 hover:bg-gray-50 transition-colors">
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-xs font-medium text-gray-900">{item.quantity}</span>
            <button onClick={() => handleUpdate(item.quantity + 1)} className="p-2 text-gray-500 hover:bg-gray-50 transition-colors">
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
