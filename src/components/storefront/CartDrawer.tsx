"use client";
import { useEffect, useRef, useState } from "react";
import { useCartDrawer } from "@/context/CartContext";
import { getCart, updateCartQuantity } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

interface DrawerItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[] | null;
    collection?: { name: string | null } | null;
  };
}

export default function CartDrawer() {
  const { isCartOpen, closeCart } = useCartDrawer();
  const [items, setItems] = useState<DrawerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendered, setRendered] = useState(false);
  const [closing, setClosing] = useState(false);
  const toast = useToast();

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
    const raf = requestAnimationFrame(() => {
      if (isCartOpen) {
        setRendered(true);
        setClosing(false);
      } else {
        setClosing(true);
        closeTimer.current = setTimeout(() => {
          setRendered(false);
          setClosing(false);
          closeTimer.current = null;
        }, 300);
      }
    });
    return () => cancelAnimationFrame(raf);
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

  const handleQuantity = async (productId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    try {
      // Optimistic update
      setItems(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity: newQty } : item
        ).filter(item => item.quantity > 0)
      );
      await updateCartQuantity(productId, newQty);
    } catch {
      toast.error("Failed to update cart");
      fetchCart();
    }
  };

  const handleSaveForLater = async (productId: string) => {
    try {
      // Optimistic delete
      setItems(prev => prev.filter(item => item.product.id !== productId));
      await toggleWishlist(productId); // Add to wishlist
      await updateCartQuantity(productId, 0); // Remove from cart
      toast.success("Saved to wishlist!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
      fetchCart();
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

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
        <div className="px-6 py-6 border-b border-[#B6925B]/20 flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2 text-[#4A3B2C]">
            <i className="ri-shopping-bag-line text-lg" />
            <h2 className="text-xl font-serif tracking-wide">Your Shopping Bag</h2>
          </div>
          <button 
            onClick={closeCart} 
            className="p-1 text-[#B6925B] hover:text-[#4A3B2C] transition-colors flex items-center justify-center"
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
              <div className="w-20 h-20 border border-[#B6925B]/20 bg-[#FAFAFA] flex items-center justify-center text-[#B6925B]">
                <i className="ri-shopping-bag-line text-4xl" />
              </div>
              <div>
                <p className="font-serif text-lg text-[#4A3B2C]">Your bag is empty</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#B6925B] mt-2">Add items to get started</p>
              </div>
              <button
                onClick={closeCart}
                className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors mt-4 rounded-none"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#B6925B]/10 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pt-6 first:pt-0">
                  {/* Product image */}
                  <div className="relative w-20 h-28 bg-[#FAFAFA] border border-[#B6925B]/20 flex-shrink-0 rounded-none">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        quality={100}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#B6925B] text-[10px] font-bold uppercase">No image</div>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#4A3B2C] line-clamp-1">{item.product.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{item.product.collection?.name || "Uncategorized"}</p>
                      <p className="text-sm font-bold text-[#B6925B] mt-1.5">₹{item.product.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty selectors */}
                      <div className="flex items-center border border-[#B6925B]/30 bg-white rounded-none">
                        <button
                          onClick={() => handleQuantity(item.product.id, item.quantity, -1)}
                          className="p-1.5 text-[#B6925B] hover:text-[#4A3B2C] transition-colors flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <i className="ri-subtract-line text-sm" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#4A3B2C]">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantity(item.product.id, item.quantity, 1)}
                          className="p-1.5 text-[#B6925B] hover:text-[#4A3B2C] transition-colors flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <i className="ri-add-line text-sm" />
                        </button>
                      </div>

                      {/* Action links */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSaveForLater(item.product.id)}
                          className="text-[10px] font-bold text-[#B6925B] hover:text-[#4A3B2C] uppercase tracking-widest transition-colors"
                        >
                          Save for Later
                        </button>
                        <button
                          onClick={() => handleQuantity(item.product.id, item.quantity, -item.quantity)}
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
          <div className="border-t border-[#B6925B]/20 p-6 bg-[#FAFAFA] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Subtotal</span>
              <span className="text-xl font-serif text-[#4A3B2C]">₹{totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shipping and taxes calculated at checkout.</p>
            <div className="grid grid-cols-1 gap-3 pt-4">
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full text-center border border-[#B6925B]/30 hover:border-[#4A3B2C] text-[#4A3B2C] py-3 text-[10px] font-bold uppercase tracking-widest transition-colors bg-white rounded-none"
              >
                View Full Bag
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full text-center bg-[#B6925B] hover:bg-[#9c7d4e] text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
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
