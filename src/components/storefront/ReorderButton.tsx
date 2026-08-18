"use client";
import { useState } from "react";
import { reorderOrder } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";

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
      className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading && <i className="ri-loader-4-line animate-spin text-base" />}
      <span>Buy Again</span>
    </button>
  );
}