"use client";
import { useEffect, useState } from "react";
import { useCartDrawer } from "@/context/CartContext";
import { getCart, updateCartQuantity } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { XMarkIcon, TrashIcon, ShoppingBagIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
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

  useEffect(() => {
    if (isCartOpen) {
      // Data fetching is async; no synchronous setState occurs in the effect body.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchCart();
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={closeCart}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBagIcon className="w-5 h-5 text-gray-900" />
            <h2 className="text-lg font-bold text-gray-900">Your Shopping Bag</h2>
          </div>
          <button 
            onClick={closeCart} 
            className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Close cart"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-sm text-gray-400">Loading your cart...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <ShoppingBagIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Your bag is empty</p>
                <p className="text-xs text-gray-400 mt-1">Add items to get started!</p>
              </div>
              <button
                onClick={closeCart}
                className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pt-6 first:pt-0">
                  {/* Product image */}
                  <div className="relative w-20 h-24 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{item.product.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.product.collection?.name || "Uncategorized"}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1.5">₹{item.product.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty selectors */}
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button
                          onClick={() => handleQuantity(item.product.id, item.quantity, -1)}
                          className="p-1 hover:text-gray-900 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-gray-700">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantity(item.product.id, item.quantity, 1)}
                          className="p-1 hover:text-gray-900 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action links */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSaveForLater(item.product.id)}
                          className="text-[10px] font-bold text-[#0D3B66] hover:underline uppercase tracking-wider"
                        >
                          Save for Later
                        </button>
                        <button
                          onClick={() => handleQuantity(item.product.id, item.quantity, -item.quantity)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <TrashIcon className="w-4 h-4" />
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
          <div className="border-t border-gray-100 p-6 bg-gray-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-gray-400">Shipping and taxes calculated at checkout.</p>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full text-center border border-gray-200 hover:border-gray-900 text-gray-700 py-3 rounded-md text-xs font-bold uppercase tracking-widest transition-colors bg-white"
              >
                View Full Bag
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full text-center bg-[#0D3B66] hover:bg-[#082a4d] text-white py-3 rounded-md text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
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
