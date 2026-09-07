"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { updateCartQuantity } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { useCartDrawer } from "@/context/CartContext";
import type { CartLineItem } from "@/features/cart/service";

interface CartPageClientProps {
  initialItems: CartLineItem[];
  isLoggedIn: boolean;
}

export default function CartPageClient({ initialItems, isLoggedIn }: CartPageClientProps) {
  const router = useRouter();
  const { setCartCount } = useCartDrawer();
  const [items, setItems] = useState<CartLineItem[]>(initialItems);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Sync state if initialItems change (e.g. on server revalidation)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Sync total count with navbar cart badge
  useEffect(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalCount);
  }, [items, setCartCount]);

  const handleUpdate = async (item: CartLineItem, newQty: number) => {
    const maxQty = item.product.stockQuantity ?? Infinity;
    // Don't allow increasing beyond stock
    if (newQty > item.quantity && newQty > maxQty) return;

    const lineId = item.id;
    setUpdatingId(lineId);

    // Optimistically update the UI immediately
    if (newQty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== lineId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === lineId ? { ...i, quantity: newQty } : i))
      );
    }

    try {
      await updateCartQuantity(item.product.id, newQty, item.variantId ?? undefined);
      router.refresh();
    } catch (err) {
      console.error("Failed to update cart quantity:", err);
      // Roll back on error
      setItems(initialItems);
    } finally {
      setUpdatingId(null);
    }
  };

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = (item.flashPrice ?? item.product.price) + (item.variant?.priceOffset || 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#7A0B2E]/20 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 border border-[#7A0B2E]/20 bg-[#F5EFE6] flex items-center justify-center text-[#7A0B2E]">
          <i className="ri-shopping-bag-line text-3xl" />
        </div>
        <p className="text-gray-500 mb-6 font-serif text-lg">Your shopping bag is empty.</p>
        <Link
          href="/collections"
          className="inline-block px-8 py-3 bg-[#7A0B2E] hover:bg-[#5C0820] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#7A0B2E]/20 shadow-sm">
      <div className="px-6 py-5 border-b border-[#7A0B2E]/20 flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-widest text-[#2D1F2F]">Your Items</span>
        <Link href="/collections" className="text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest hover:text-[#2D1F2F]">
          + Add More
        </Link>
      </div>

      <div className="px-6 divide-y divide-[#7A0B2E]/10">
        {items.map((item) => {
          const maxQty = item.product.stockQuantity ?? Infinity;
          const atStockLimit = item.quantity >= maxQty;
          const isItemUpdating = updatingId === item.id;

          const unitPrice = (item.flashPrice ?? item.product.price) + (item.variant?.priceOffset || 0);
          const originalUnitPrice =
            (item.product.originalPrice && item.product.originalPrice > item.product.price
              ? item.product.originalPrice
              : item.product.price) + (item.variant?.priceOffset || 0);

          return (
            <div key={item.id} className="flex gap-6 py-6 relative">
              <Link
                href={`/products/${item.product.slug}`}
                className="relative w-24 h-32 md:w-32 md:h-40 bg-[#F5EFE6] flex-shrink-0 rounded-none overflow-hidden border border-[#7A0B2E]/20 hover:opacity-90 transition-opacity"
              >
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    quality={100}
                    sizes="(max-width: 768px) 96px, 128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7A0B2E] text-xs font-bold uppercase">
                    No image
                  </div>
                )}
              </Link>

              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
                      <h3 className="text-base font-serif font-bold text-[#2D1F2F]">{item.product.name}</h3>
                    </Link>
                    {item.product.collection && (
                      <p className="text-xs text-[#7A0B2E] mt-1 uppercase tracking-widest">{item.product.collection.name}</p>
                    )}
                    {item.variant && (
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2 bg-[#F5EFE6] px-2 py-1 inline-block rounded-none border border-[#7A0B2E]/20">
                        {[item.variant.size, item.variant.color].filter(Boolean).join(" - ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {item.flashPercent ? (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-[#7A0B2E] text-white px-1.5 py-0.5 rounded-none">
                        Flash {item.flashPercent}% OFF
                      </span>
                    ) : null}
                    <p className="text-base font-bold text-[#2D1F2F]">
                      Rs. {(unitPrice * item.quantity).toLocaleString("en-IN")}
                    </p>
                    {item.flashPrice != null && item.flashPrice < originalUnitPrice && (
                      <p className="text-xs text-gray-400 line-through">
                        Rs. {(originalUnitPrice * item.quantity).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center w-24 h-8 border border-[#7A0B2E]/30 rounded-none bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdate(item, item.quantity - 1)}
                        disabled={isItemUpdating || item.quantity <= 1}
                        className="w-1/3 h-full text-[#2D1F2F] hover:text-[#7A0B2E] transition-colors flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <i className="ri-subtract-line text-sm" />
                      </button>
                      <div className="w-1/3 h-full flex items-center justify-center text-xs font-bold text-[#2D1F2F]">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdate(item, item.quantity + 1)}
                        disabled={isItemUpdating || atStockLimit}
                        className="w-1/3 h-full text-[#2D1F2F] hover:text-[#7A0B2E] transition-colors flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <i className="ri-add-line text-sm" />
                      </button>
                    </div>
                    {item.quantity > maxQty ? (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 border border-red-100">
                        Limit: {maxQty}
                      </span>
                    ) : atStockLimit && item.product.stockQuantity != null ? (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 border border-red-100">
                        Only {item.product.stockQuantity} left
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdate(item, 0)}
                    disabled={isItemUpdating}
                    className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-base" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#7A0B2E]/20 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Subtotal</span>
          <span className="text-2xl font-serif text-[#2D1F2F]">Rs. {subtotal.toLocaleString("en-IN")}</span>
        </div>
        <Link
          href={isLoggedIn ? "/checkout" : "/login?callbackUrl=/checkout"}
          className="w-full sm:w-auto text-center bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-12 py-4 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
        >
          Proceed to Checkout
        </Link>
      </div>

      {!isLoggedIn && (
        <p className="px-6 pb-6 text-xs text-center text-gray-500 leading-relaxed">
          You are checking out as a guest. Log in to save your order to your account.
        </p>
      )}
    </div>
  );
}
