"use client";
import { useState } from "react";
import { addToCart } from "@/actions/cart";
import { Loader2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ productId, outOfStock }: { productId: string, outOfStock: boolean }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(productId, 1);
      alert("Added to cart!");
      router.refresh(); // Refresh to update cart counter in navbar
    } catch (error) {
      alert("Failed to add to cart");
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
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <ShoppingBag className="w-5 h-5" />
          {outOfStock ? "Out of Stock" : "Add to Bag"}
        </>
      )}
    </button>
  );
}
