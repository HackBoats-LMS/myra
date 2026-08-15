"use client";
import { useState } from "react";
import { validateCouponAction } from "@/actions/cart";
import { useToast } from "@/components/ui/Toast";

export default function CartCouponBox({ subtotal }: { subtotal: number }) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<string | null>(() => {
    try {
      return localStorage.getItem("myra_coupon");
    } catch {
      return null;
    }
  });
  const [validating, setValidating] = useState(false);
  const toast = useToast();

  const apply = async () => {
    const code = input.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    try {
      await validateCouponAction(code, subtotal);
      setApplied(code);
      setInput("");
      try {
        localStorage.setItem("myra_coupon", code);
      } catch {
        /* ignore */
      }
      toast.success(`Coupon ${code} applied. It will be used at checkout.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally {
      setValidating(false);
    }
  };

  const remove = () => {
    setApplied(null);
    setInput("");
    try {
      localStorage.removeItem("myra_coupon");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white border border-[#B6925B]/20 shadow-sm p-4 mb-4">
      <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Promo Code</label>
      {applied ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
          <span className="flex items-center gap-1 font-bold">
            <i className="ri-ticket-2-line text-sm" />
            {applied} Applied
          </span>
          <button onClick={remove} className="text-red-500 font-bold hover:underline">Remove</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="WELCOME10"
            className="flex-1 bg-transparent border border-[#B6925B]/20 px-3 py-2 text-xs focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] uppercase rounded-none"
          />
          <button
            onClick={apply}
            disabled={validating || !input.trim()}
            className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center rounded-none"
          >
            {validating ? <i className="ri-loader-4-line animate-spin text-base" /> : "Apply"}
          </button>
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-2">Your code is applied automatically at checkout.</p>
    </div>
  );
}