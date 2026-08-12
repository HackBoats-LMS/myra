"use client";
import { useState } from "react";
import { addToCart } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function MoveToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleMove = async () => {
    setLoading(true);
    try {
      await addToCart(productId, 1);
      await toggleWishlist(productId); // Removes it from wishlist
      toast.success("Moved item to cart!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMove}
      disabled={loading}
      className="w-full mt-2 border border-[#B6925B]/20 hover:border-[#4A3B2C] text-[#4A3B2C] py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? (
        <i className="ri-loader-4-line animate-spin text-base" />
      ) : (
        <>
          <i className="ri-shopping-bag-line text-sm" />
          <span>Move to Bag</span>
        </>
      )}
    </button>
  );
}
