"use client";
import { useState } from "react";
import { toggleWishlist } from "@/actions/wishlist";
import { HeartIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function WishlistButton({ productId, isWishlisted = false }: { productId: string, isWishlisted?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const result = await toggleWishlist(productId);
      setWishlisted(result);
      toast.success(result ? "Added to wishlist!" : "Removed from wishlist.");
      router.refresh();
    } catch (error: any) {
      toast.error("Please log in to save items to your wishlist.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isProcessing}
      className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-sm transition-all"
    >
      {isProcessing ? (
        <ArrowPathIcon className="w-4 h-4 animate-spin text-gray-500" />
      ) : (
        <HeartIcon className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      )}
    </button>
  );
}
