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
  displayPrice?: number;
  displayOriginal?: number | null;
  flashPercent?: number | null;
}

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

export default function AddToCartButton({ 
  productId, 
  outOfStock, 
  variants = [],
  displayPrice,
  displayOriginal,
  flashPercent
}: AddToCartProps) {
  const router = useRouter();
  const toast = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Variant management
  const hasDbVariants = variants && variants.length > 0;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasDbVariants ? variants[0].id : null
  );
  const [fallbackSize, setFallbackSize] = useState<string>("S");

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const isCurrentlyOutOfStock = hasDbVariants 
    ? (selectedVariant ? selectedVariant.stockQuantity <= 0 : false) 
    : outOfStock;

  // Compute effective price including variant offset
  const basePrice = displayPrice ?? 0;
  const effectivePrice = selectedVariant ? basePrice + selectedVariant.priceOffset : basePrice;
  const effectiveOriginal = displayOriginal != null 
    ? (selectedVariant ? displayOriginal + selectedVariant.priceOffset : displayOriginal)
    : null;

  // Calculate discount percentage if not already passed
  const calculatedDiscountPercent = flashPercent ?? (
    effectiveOriginal && effectiveOriginal > effectivePrice
      ? Math.round(((effectiveOriginal - effectivePrice) / effectiveOriginal) * 100)
      : null
  );

  const handleAddToCart = async (redirect = false) => {
    if (hasDbVariants && !selectedVariantId) {
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
    <div className="space-y-5">
      {/* Sizes Section */}
      <div className="flex flex-wrap gap-3">
        {hasDbVariants ? (
          variants.map((v) => {
            const isSelected = selectedVariantId === v.id;
            const isOutOfStock = v.stockQuantity <= 0;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariantId(v.id)}
                disabled={isOutOfStock}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-serif border transition-all ${
                  isSelected
                    ? "border-[#b88e4f] bg-[#b88e4f] text-white font-medium shadow-xs"
                    : "border-[#b88e4f]/60 text-[#b88e4f] hover:border-[#b88e4f] bg-white"
                } ${isOutOfStock ? "opacity-30 cursor-not-allowed line-through" : "cursor-pointer"}`}
              >
                {v.size || "S"}
              </button>
            );
          })
        ) : (
          DEFAULT_SIZES.map((size) => {
            const isSelected = fallbackSize === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setFallbackSize(size)}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-sm font-serif border transition-all ${
                  isSelected
                    ? "border-[#b88e4f] bg-[#b88e4f] text-white font-medium shadow-xs"
                    : "border-[#b88e4f]/60 text-[#b88e4f] hover:border-[#b88e4f] bg-white cursor-pointer"
                }`}
              >
                {size}
              </button>
            );
          })
        )}
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center w-28 h-9 sm:h-10 border border-[#b88e4f] bg-white">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-8 h-full flex items-center justify-center text-sm font-serif text-[#b88e4f] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <div className="flex-1 h-full flex items-center justify-center text-sm font-serif text-[#171717]">
          {quantity}
        </div>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          className="w-8 h-full flex items-center justify-center text-sm font-serif text-[#b88e4f] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Price Row (if displayPrice is provided) */}
      {displayPrice !== undefined && (
        <div className="flex items-baseline gap-2.5 pt-1">
          <span className="text-2xl sm:text-[26px] font-serif text-[#171717]">
            Rs. {effectivePrice.toLocaleString("en-IN")}
          </span>
          {effectiveOriginal != null && effectiveOriginal > effectivePrice && (
            <span className="text-base sm:text-lg font-serif text-gray-500 line-through">
              ₹{effectiveOriginal.toLocaleString("en-IN")}
            </span>
          )}
          {calculatedDiscountPercent && calculatedDiscountPercent > 0 && (
            <span className="text-sm sm:text-base font-serif text-[#1b7a43] font-medium">
              {calculatedDiscountPercent}%
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={isAdding || isCurrentlyOutOfStock}
          className="w-full bg-white border border-[#b88e4f] text-[#b88e4f] hover:bg-[#FAF6F0] py-3 text-xs sm:text-sm font-serif tracking-wide capitalize transition-colors disabled:opacity-50 cursor-pointer block text-center"
        >
          {isAdding ? "Adding..." : (isCurrentlyOutOfStock ? "Out of Stock" : "Add To Cart")}
        </button>

        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={isAdding || isCurrentlyOutOfStock}
          className="w-full bg-[#b88e4f] hover:bg-[#a37c40] text-white py-3 text-xs sm:text-sm font-serif tracking-wide capitalize transition-colors disabled:opacity-50 cursor-pointer block text-center"
        >
          Buy
        </button>
      </div>
    </div>
  );
}

