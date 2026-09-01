"use client";
import { useState } from "react";
import { reorderOrder } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { ShoppingBag, Loader2 } from "lucide-react";

export default function ReorderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleReorder = async () => {
    setLoading(true);
    try {
      await reorderOrder(orderId);
      toast.success("Items added to your cart!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReorder}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 sm:px-5 py-2.5 rounded-none text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-sm disabled:opacity-50 flex-1 sm:flex-initial"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      <span>Buy Again</span>
    </button>
  );
}
