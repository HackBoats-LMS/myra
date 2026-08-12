"use client";
import { useState } from "react";
import { addToCart } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { ArrowPathIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
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
      className="w-full mt-2 border border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? (
        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          <ShoppingBagIcon className="w-3.5 h-3.5" />
          <span>Move to Bag</span>
        </>
      )}
    </button>
  );
}
