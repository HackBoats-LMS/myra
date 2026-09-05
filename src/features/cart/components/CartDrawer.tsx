"use client";
import { useEffect, useRef, useState } from "react";
import { useCartDrawer } from "@/context/CartContext";
import { getCart, updateCartQuantity } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface DrawerItem {
  id: string;
  quantity: number;
  variantId?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    flashPercent?: number;
    images?: string[] | null;
    collection?: { name: string | null } | null;
  };
  variant?: { priceOffset: number; size?: string | null; color?: string | null } | null;
}

export default function CartDrawer() {
  const { isCartOpen, closeCart, setCartCount } = useCartDrawer();
  const router = useRouter();
  const [items, setItems] = useState<DrawerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendered, setRendered] = useState(false);
  const [closing, setClosing] = useState(false);
  const toast = useToast();

  // Sync total count back to context whenever items change
  useEffect(() => {
    if (!loading) {
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
    }
  }, [items, loading, setCartCount]);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setItems(data as DrawerItem[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle mount/unmount with animation
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    
    if (isCartOpen) {
      setRendered(true);
      setClosing(true);
      // Small delay to allow DOM to render off-screen before sliding in
      setTimeout(() => {
        setClosing(false);
      }, 10);
    } else {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setRendered(false);
        setClosing(false);
        closeTimer.current = null;
      }, 300);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (rendered) {
      // Data fetching is async; no synchronous setState occurs in the effect body.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isCartOpen) void fetchCart();
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [rendered, isCartOpen]);

  if (!rendered) return null;

  const handleQuantity = async (productId: string, variantId: string | null | undefined, newQty: number) => {
    try {
      // Optimistic update keyed by the line id (unique per product+variant).
      setItems(prev =>
        prev.map(item =>
          item.product.id === productId && (item.variantId || null) === (variantId || null)
            ? { ...item, quantity: newQty }
            : item
        ).filter(item => item.quantity > 0)
      );
      await updateCartQuantity(productId, newQty, variantId ?? undefined);
      router.refresh();
    } catch {
      toast.error("Failed to update cart");
      fetchCart();
    }
  };

  const handleSaveForLater = async (productId: string, variantId?: string | null) => {
    try {
      // Optimistic delete keyed by product+variant.
      setItems(prev => prev.filter(item => !(item.product.id === productId && (item.variantId || null) === (variantId || null))));
      await toggleWishlist(productId); // Add to wishlist
      await updateCartQuantity(productId, 0, variantId ?? undefined); // Remove from cart
      toast.success("Saved to wishlist!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
      fetchCart();
    }
  };

  // Effective unit price includes the variant offset, matching cart/checkout.
  const linePrice = (item: DrawerItem) =>
    (item.product.price + (item.variant?.priceOffset || 0)) * item.quantity;
  const totalAmount = items.reduce((sum, item) => sum + linePrice(item), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`} 
        onClick={closeCart}
      />

      {/* Drawer Container */}
      <div className={`relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 rounded-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${closing ? "translate-x-full" : "translate-x-0"}`}>
        {/* Header */}
        <div className="px-6 py-6 border-b border-[#7A0B2E]/20 flex items-center justify-between bg-[#F5EFE6]">
          <div className="flex items-center gap-2 text-[#2D1F2F]">
            <i className="ri-shopping-bag-line text-lg" />
            <h2 className="text-xl font-serif tracking-wide">Your Shopping Bag</h2>
          </div>
          <button 
            onClick={closeCart} 
            className="p-1 text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors flex items-center justify-center"
            aria-label="Close cart"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading your cart...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 border border-[#7A0B2E]/20 bg-[#F5EFE6] flex items-center justify-center text-[#7A0B2E]">
                <i className="ri-shopping-bag-line text-4xl" />
              </div>
              <div>
                <p className="font-serif text-lg text-[#2D1F2F]">Your bag is empty</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#7A0B2E] mt-2">Add items to get started</p>
              </div>
              <button
                onClick={closeCart}
                className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors mt-4 rounded-none"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#7A0B2E]/10 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pt-6 first:pt-0">
                  {/* Product image */}
                  <div className="relative w-20 h-28 bg-[#F5EFE6] border border-[#7A0B2E]/20 flex-shrink-0 rounded-none">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        quality={100}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#7A0B2E] text-[10px] font-bold uppercase">No image</div>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#2D1F2F] line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{item.product.collection?.name || "Uncategorized"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-sm font-bold text-[#7A0B2E]">₹{(item.product.price + (item.variant?.priceOffset || 0)).toFixed(2)}</p>
                        {item.product.originalPrice != null && item.product.originalPrice + (item.variant?.priceOffset || 0) > item.product.price + (item.variant?.priceOffset || 0) && (
                          <p className="text-xs text-gray-400 line-through">₹{(item.product.originalPrice + (item.variant?.priceOffset || 0)).toFixed(2)}</p>
                        )}
                        {item.product.flashPercent ? (
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-[#7A0B2E] text-white px-1.5 py-0.5 rounded-none">
                            -{item.product.flashPercent}%
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty selectors */}
                      <div className="flex items-center border border-[#7A0B2E]/30 bg-white rounded-none">
                        <button
                          onClick={() => handleQuantity(item.product.id, item.variantId, item.quantity - 1)}
                          className="p-1.5 text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <i className="ri-subtract-line text-sm" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#2D1F2F]">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantity(item.product.id, item.variantId, item.quantity + 1)}
                          className="p-1.5 text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <i className="ri-add-line text-sm" />
                        </button>
                      </div>

                      {/* Action links */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSaveForLater(item.product.id, item.variantId)}
                          className="text-[10px] font-bold text-[#7A0B2E] hover:text-[#2D1F2F] uppercase tracking-widest transition-colors"
                        >
                          Save for Later
                        </button>
                        <button
                          onClick={() => handleQuantity(item.product.id, item.variantId, 0)}
                          className="p-1 text-gray-400 hover:text-red-700 transition-colors flex items-center justify-center"
                          title="Remove item"
                        >
                          <i className="ri-delete-bin-line text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer (if items > 0) */}
        {items.length > 0 && (
          <div className="border-t border-[#7A0B2E]/20 p-6 bg-[#F5EFE6] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Subtotal</span>
              <span className="text-xl font-serif text-[#2D1F2F]">₹{totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipping and taxes calculated at checkout.</p>
            <div className="grid grid-cols-1 gap-3 pt-4">
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full text-center border border-[#7A0B2E]/30 hover:border-[#2D1F2F] text-[#2D1F2F] py-3 text-[10px] font-bold uppercase tracking-widest transition-colors bg-white rounded-none"
              >
                View Full Bag
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full text-center bg-[#7A0B2E] hover:bg-[#5C0820] text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
