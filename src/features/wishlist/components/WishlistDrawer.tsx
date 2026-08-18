"use client";
import { useEffect, useRef, useState } from "react";
import { useWishlistDrawer } from "@/context/WishlistContext";
import { getWishlist, toggleWishlist, type WishlistDrawerItem } from "@/actions/wishlist";
import { addToCart } from "@/actions/cart";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function WishlistDrawer() {
  const { isWishlistOpen, closeWishlist } = useWishlistDrawer();
  const [items, setItems] = useState<WishlistDrawerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendered, setRendered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [movingAll, setMovingAll] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist();
      setItems(data);
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
    
    if (isWishlistOpen) {
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
  }, [isWishlistOpen]);

  useEffect(() => {
    if (rendered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isWishlistOpen) void fetchWishlist();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [rendered, isWishlistOpen]);

  if (!rendered) return null;

  const handleRemove = async (item: WishlistDrawerItem) => {
    setBusyId(item.id);
    try {
      await toggleWishlist(item.product.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Removed from wishlist");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveToBag = async (item: WishlistDrawerItem) => {
    setBusyId(item.id);
    try {
      const res = await addToCart(item.product.id, 1);
      if (!res.added) {
        toast.error(res.message || "Unable to add item to cart.");
        return;
      }
      await toggleWishlist(item.product.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Moved to bag!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveAllToBag = async () => {
    if (items.length === 0) return;
    setMovingAll(true);
    let moved = 0;
    let skipped = 0;
    const snapshot = [...items];
    for (const item of snapshot) {
      try {
        const res = await addToCart(item.product.id, 1);
        if (!res.added) {
          skipped += 1;
          continue;
        }
        await toggleWishlist(item.product.id);
        moved += 1;
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } catch {
        skipped += 1;
      }
    }
    if (moved > 0) toast.success(`Moved ${moved} item${moved > 1 ? "s" : ""} to bag`);
    if (skipped > 0) toast.error(`Skipped ${skipped} item${skipped > 1 ? "s" : ""} (out of stock or variants required)`);
    setMovingAll(false);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={closeWishlist}
      />

      {/* Drawer Container */}
      <div className={`relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 rounded-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${closing ? "translate-x-full" : "translate-x-0"}`}>
        {/* Header */}
        <div className="px-6 py-6 border-b border-[#B6925B]/20 flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-2 text-[#4A3B2C]">
            <i className="ri-heart-line text-lg text-[#B6925B]" />
            <h2 className="text-xl font-serif tracking-wide">Your Wishlist</h2>
          </div>
          <button
            onClick={closeWishlist}
            className="p-1 text-[#B6925B] hover:text-[#4A3B2C] transition-colors flex items-center justify-center"
            aria-label="Close wishlist"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading your wishlist...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 border border-[#B6925B]/20 bg-[#FAFAFA] flex items-center justify-center text-[#B6925B]">
                <i className="ri-heart-line text-4xl" />
              </div>
              <div>
                <p className="font-serif text-lg text-[#4A3B2C]">Your wishlist is empty</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#B6925B] mt-2">Save items you love to find them later</p>
              </div>
              <button
                onClick={closeWishlist}
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
                  <Link href={`/products/${item.product.slug}`} onClick={closeWishlist} className="relative w-20 h-28 bg-[#FAFAFA] border border-[#B6925B]/20 flex-shrink-0 rounded-none">
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
                  </Link>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.product.slug}`} onClick={closeWishlist} className="hover:underline">
                        <h4 className="text-sm font-bold text-[#4A3B2C] line-clamp-1">{item.product.name}</h4>
                      </Link>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{item.product.collection?.name || "Uncategorized"}</p>
                      <p className="text-sm font-bold text-[#B6925B] mt-1.5">₹{item.product.price.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => handleMoveToBag(item)}
                        disabled={busyId === item.id}
                        className="border border-[#B6925B]/30 text-[#B6925B] hover:bg-[#B6925B] hover:text-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 disabled:opacity-50 rounded-none"
                      >
                        {busyId === item.id ? (
                          <i className="ri-loader-4-line animate-spin text-sm" />
                        ) : (
                          <i className="ri-shopping-bag-line text-sm" />
                        )}
                        <span>Move to Bag</span>
                      </button>
                      <button
                        onClick={() => handleRemove(item)}
                        disabled={busyId === item.id}
                        className="p-2 text-gray-400 hover:text-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        title="Remove from wishlist"
                      >
                        <i className="ri-delete-bin-line text-base" />
                      </button>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Items Saved</span>
              <span className="text-xl font-serif text-[#4A3B2C]">{items.length}</span>
            </div>
            <button
              onClick={handleMoveAllToBag}
              disabled={movingAll}
              className="w-full border border-[#B6925B]/30 text-[#B6925B] hover:bg-[#B6925B] hover:text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-none disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {movingAll ? (
                <i className="ri-loader-4-line animate-spin text-sm" />
              ) : (
                <i className="ri-shopping-bag-line text-sm" />
              )}
              <span>Move All to Bag</span>
            </button>
            <Link
              href="/wishlist"
              onClick={closeWishlist}
              className="w-full text-center bg-[#B6925B] hover:bg-[#9c7d4e] text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
            >
              View Full Wishlist
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}