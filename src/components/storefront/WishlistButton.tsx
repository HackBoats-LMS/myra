"use client";
import { useState } from "react";
import { toggleWishlist } from "@/actions/wishlist";
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
    } catch {
      toast.error("Could not update wishlist. Please try again.");
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
        <i className="ri-loader-4-line animate-spin text-base text-gray-500 leading-none" />
      ) : (
        <i className={`text-base leading-none ${wishlisted ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600'}`} />
      )}
    </button>
  );
}
