"use client";
import { useState } from "react";
import { toggleWishlist } from "@/actions/wishlist";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WishlistButton({ productId, isWishlisted = false }: { productId: string, isWishlisted?: boolean }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product details if clicked inside a Link
    setIsProcessing(true);
    try {
      const result = await toggleWishlist(productId);
      setWishlisted(result);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Please log in to add to wishlist");
      router.push("/login");
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
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      ) : (
        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      )}
    </button>
  );
}
