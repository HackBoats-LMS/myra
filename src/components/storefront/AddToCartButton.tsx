"use client";
import { useState } from "react";
import { addToCart } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  stockQuantity: number;
  priceOffset: number;
}

interface AddToCartProps {
  productId: string;
  outOfStock: boolean;
  variants?: Variant[];
  /** Base (flash-adjusted) selling price used to show the variant-adjusted price. */
  price?: number;
}

export default function AddToCartButton({ productId, outOfStock, variants = [], price }: AddToCartProps) {
  const router = useRouter();
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null
  );

  const hasVariants = variants && variants.length > 0;
  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  
  const isCurrentlyOutOfStock = hasVariants 
    ? (selectedVariant ? selectedVariant.stockQuantity <= 0 : false) 
    : outOfStock;

  const handleAddToCart = async (redirect = false) => {
    if (hasVariants && !selectedVariantId) {
      toast.error("Please select a size before adding to cart.");
      return;
    }

    setIsAdding(true);
    try {
      const res = await addToCart(productId, quantity, selectedVariantId || undefined);
      if (!res.added) {
        toast.error(res.message || "Unable to add item to cart.");
        return;
      }
      toast.success("Added to cart!");
      if (redirect) {
        router.push("/cart");
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {hasVariants && (
        <div className="space-y-3">
          {/* Show the effective price for the selected variant so it matches
              what is actually charged (base price + variant offset). */}
          {price != null && (
            <p className="text-sm font-bold text-[#4A3B2C]">
              ₹{((price ?? 0) + (selectedVariant?.priceOffset || 0)).toLocaleString('en-IN')}
              {selectedVariant?.priceOffset ? (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">
                  +₹{selectedVariant.priceOffset.toLocaleString('en-IN')}
                </span>
              ) : null}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              const isVariantOutOfStock = v.stockQuantity <= 0;
              
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={isVariantOutOfStock}
                  className={`w-10 h-10 flex items-center justify-center text-sm font-serif border transition-all
                    ${isSelected 
                      ? 'border-[#B6925B] text-[#B6925B] font-bold' 
                      : 'border-[#B6925B]/20 text-gray-500 hover:border-[#B6925B] hover:text-[#B6925B]'}
                    ${isVariantOutOfStock ? 'opacity-40 cursor-not-allowed line-through' : ''}
                  `}
                >
                  {v.size || "S"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center w-24 h-10 border border-[#B6925B]/20 rounded-none bg-white">
        <button 
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-1/3 h-full text-gray-500 hover:text-[#B6925B]"
        >-</button>
        <div className="w-1/3 h-full flex items-center justify-center text-sm font-bold text-[#4A3B2C]">
          {quantity}
        </div>
        <button 
          onClick={() => setQuantity(quantity + 1)}
          className="w-1/3 h-full text-gray-500 hover:text-[#B6925B]"
        >+</button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 pt-2">
        <button 
          onClick={() => handleAddToCart(false)}
          disabled={isAdding || isCurrentlyOutOfStock}
          className="w-full bg-white border border-[#B6925B] text-[#B6925B] hover:bg-[#FDFBF7] px-8 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          {isAdding ? "Adding..." : (isCurrentlyOutOfStock ? "Out of Stock" : "Add To cart")}
        </button>
        <button 
          onClick={() => handleAddToCart(true)}
          disabled={isAdding || isCurrentlyOutOfStock}
          className="w-full bg-[#B6925B] border border-[#B6925B] text-white hover:bg-[#9c7d4e] px-8 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          Buy
        </button>
      </div>
    </div>
  );
}
