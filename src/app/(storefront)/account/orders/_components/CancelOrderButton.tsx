"use client";
import { useState } from "react";
import { cancelOrder } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="bg-red-50 hover:bg-red-100 text-red-700 px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border border-red-200 disabled:opacity-50"
    >
      {loading && <i className="ri-loader-4-line animate-spin text-base" />}
      <span>Cancel Order</span>
    </button>
  );
}
