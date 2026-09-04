"use client";
import { useState } from "react";
import { createCoupon } from "@/actions/coupons";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

export default function CreateCouponForm() {
  const [loading, setLoading] = useState(false);
  const [couponType, setCouponType] = useState("STANDARD");
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createCoupon(formData);
      toast.success("Coupon created successfully!");
      router.push("/admin/coupons");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon.");
      setLoading(false);
    }
  };

  const typeHelp: Record<string, string> = {
    STANDARD: "A normal discount code customers can enter at checkout.",
    FIRST_ORDER: "Applies only to a customer's very first order. Auto-applied at checkout.",
    SINGLE_USE: "Can only be used once per customer. Auto-applied at checkout.",
    FESTIVAL: "Seasonal offer, auto-applied at checkout during its active period.",
    SHIPPING: "Discounts the shipping cost (0 = free shipping). Works alongside other discounts.",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="type" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Offer Type *</label>
          <select
            id="type"
            name="type"
            value={couponType}
            onChange={(e) => setCouponType(e.target.value)}
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          >
            <option value="STANDARD">Standard — Entered as a promo code</option>
            <option value="FIRST_ORDER">First Order — for every new customer</option>
            <option value="SINGLE_USE">Single Use — once per customer</option>
            <option value="FESTIVAL">Festival — seasonal offer</option>
            <option value="SHIPPING">Shipping — free / discounted shipping</option>
          </select>
          <p className="text-xs text-gray-500">{typeHelp[couponType]}</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="code" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Coupon Code *</label>
          <input
            type="text"
            id="code"
            name="code"
            required
            placeholder="e.g. SUMMER20"
            className="w-full uppercase font-mono px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Offer Title / Description (Optional)</label>
          <input
            type="text"
            id="description"
            name="description"
            maxLength={120}
            placeholder="e.g. Free shipping on your first order"
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="discountType" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Discount Type *</label>
          <select
            id="discountType"
            name="discountType"
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="discountValue" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Discount Value *</label>
          <input
            type="number"
            id="discountValue"
            name="discountValue"
            required
            min="0.01"
            step="0.01"
            placeholder="e.g. 20"
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="minOrderAmount" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Min. Order Amount (₹)</label>
          <input
            type="number"
            id="minOrderAmount"
            name="minOrderAmount"
            min="0"
            step="0.01"
            placeholder="0"
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUses" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Max Total Uses (Optional)</label>
          <input
            type="number"
            id="maxUses"
            name="maxUses"
            min="1"
            step="1"
            placeholder="Leave blank for unlimited"
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
          <p className="text-xs text-gray-500">Overall redemption limit across all customers.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUsesPerUser" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Uses Per Customer (Optional)</label>
          <input
            type="number"
            id="maxUsesPerUser"
            name="maxUsesPerUser"
            min="1"
            step="1"
            placeholder={couponType === "SINGLE_USE" ? "1" : "Leave blank for unlimited"}
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
          <p className="text-xs text-gray-500">How many times one customer can use this coupon.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="expiresAt" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Expiry Date (Optional)</label>
          <input
            type="date"
            id="expiresAt"
            name="expiresAt"
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#2D1F2F] hover:bg-[#220510] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 rounded-none"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Create Coupon</span>
        </button>
      </div>
    </form>
  );
}
