"use client";
import { useState } from "react";
import { cancelOrder } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { XCircle, Loader2 } from "lucide-react";

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
      className="inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-700 px-4 sm:px-5 py-2.5 rounded-none text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-sm border border-red-200 hover:border-red-300 disabled:opacity-50 flex-1 sm:flex-initial"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
      <span>Cancel Order</span>
    </button>
  );
}

