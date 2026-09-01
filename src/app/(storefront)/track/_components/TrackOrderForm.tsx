"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function TrackOrderForm() {
  const router = useRouter();
  const toast = useToast();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) {
      toast.error("Please enter your order ID.");
      return;
    }
    setLoading(true);
    router.push(`/track/${encodeURIComponent(id)}?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#B6925B]/20 p-6 space-y-4 shadow-sm">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Order ID</label>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          required
          placeholder="e.g. 9f3c... or your order number"
          className="w-full border border-[#B6925B]/30 px-3 py-2.5 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Email (used at checkout)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-[#B6925B]/30 px-3 py-2.5 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#4A3B2C] hover:bg-[#B6925B] text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-50"
      >
        {loading ? "Tracking..." : "Track Order"}
      </button>
    </form>
  );
}
