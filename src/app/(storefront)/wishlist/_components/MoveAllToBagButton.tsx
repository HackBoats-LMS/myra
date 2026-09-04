"use client";
import { useState } from "react";
import { addToCart } from "@/actions/cart";
import { toggleWishlist } from "@/actions/wishlist";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function MoveAllToBagButton({ productIds }: { productIds: string[] }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleMoveAll = async () => {
    if (productIds.length === 0) return;
    setLoading(true);
    let moved = 0;
    let skipped = 0;
    for (const id of productIds) {
      try {
        const res = await addToCart(id, 1);
        if (!res.added) {
          skipped += 1;
          continue;
        }
        await toggleWishlist(id);
        moved += 1;
      } catch {
        skipped += 1;
      }
    }
    if (moved > 0) toast.success(`Moved ${moved} item${moved > 1 ? "s" : ""} to bag`);
    if (skipped > 0) toast.error(`Skipped ${skipped} item${skipped > 1 ? "s" : ""} (out of stock or variants required)`);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleMoveAll}
      disabled={loading}
      className="border border-[#7A0B2E]/30 text-[#7A0B2E] hover:bg-[#7A0B2E] hover:text-white px-6 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? (
        <i className="ri-loader-4-line animate-spin text-sm" />
      ) : (
        <i className="ri-shopping-bag-line text-sm" />
      )}
      <span>Move All to Bag</span>
    </button>
  );
}
