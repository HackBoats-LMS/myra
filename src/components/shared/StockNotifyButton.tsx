"use client";
import { useState } from "react";
import { subscribeStockAlert } from "@/actions/stock-alert";
import { useToast } from "@/components/ui/Toast";

export default function StockNotifyButton({ productId }: { productId: string }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subscribeStockAlert(productId, email);
      setSubscribed(true);
      toast.success("You'll be notified when this is back in stock.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-3 text-xs font-semibold text-green-700">
        <i className="ri-checkbox-circle-fill text-lg" />
        You&apos;re on the list! We&apos;ll email you when this item is back in stock.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#7A0B2E]/30 p-4 space-y-3 bg-[#F5EFE6]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">
        <i className="ri-notification-3-line mr-1 text-[#7A0B2E]" />
        Notify me when back in stock
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 min-w-0 border border-[#7A0B2E]/30 px-3 py-2.5 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] bg-white rounded-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#2D1F2F] hover:bg-[#7A0B2E] text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Saving..." : "Notify me"}
        </button>
      </div>
    </form>
  );
}
