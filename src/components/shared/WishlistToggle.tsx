"use client";
import { useState } from "react";
import { toggleWishlist } from "@/actions/wishlist";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function WishlistButton({
  productId,
  isWishlisted = false,
  className = "w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm transition-all rounded-full",
  iconClassName = "text-base leading-none",
}: {
  productId: string;
  isWishlisted?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={className}
    >
      {isProcessing ? (
        <i className="ri-loader-4-line animate-spin text-gray-500 leading-none" />
      ) : (
        <i className={`${iconClassName} ${wishlisted ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-600 hover:text-black'}`} />
      )}
    </button>
  );
}
