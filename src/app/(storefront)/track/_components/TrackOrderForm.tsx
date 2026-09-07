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
    const id = orderId.trim().replace(/^#/, "");
    if (!id) {
      toast.error("Please enter your Order ID, reference code, or AWB tracking number.");
      return;
    }
    setLoading(true);
    const emailParam = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/track/${encodeURIComponent(id)}${emailParam}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#7A0B2E]/20 p-6 space-y-4 shadow-sm">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-1">
          Order ID / Tracking Number
        </label>
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          required
          placeholder="e.g. 2db7d90e, full Order ID, or AWB code"
          className="w-full border border-[#7A0B2E]/30 px-3 py-2.5 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-1">
          Email <span className="text-gray-400 font-normal lowercase">(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com (optional)"
          className="w-full border border-[#7A0B2E]/30 px-3 py-2.5 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2D1F2F] hover:bg-[#7A0B2E] text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-50"
      >
        {loading ? "Tracking..." : "Track Order"}
      </button>
    </form>
  );
}
