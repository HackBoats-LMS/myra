"use client";
import { useState } from "react";
import { addToCart } from "@/actions/cart";
import { ArrowPathIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function AddToCartButton({ productId, outOfStock }: { productId: string, outOfStock: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(productId, 1);
      toast.success("Added to bag!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to add to bag. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isAdding || outOfStock}
      className="w-full bg-[#0D3B66] hover:bg-[#082a4d] text-white px-8 py-4 rounded-none text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
    >
      {isAdding ? (
        <ArrowPathIcon className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <ShoppingBagIcon className="w-5 h-5" />
          {outOfStock ? "Out of Stock" : "Add to Bag"}
        </>
      )}
    </button>
  );
}
