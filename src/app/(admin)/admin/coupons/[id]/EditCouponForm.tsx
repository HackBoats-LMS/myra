"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCoupon } from "@/actions/coupons";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

interface EditCouponFormProps {
  coupon: {
    id: string;
    code: string;
    type: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    expiresAt: Date | null;
  };
}

export default function EditCouponForm({ coupon }: EditCouponFormProps) {
  const [loading, setLoading] = useState(false);
  const [couponType, setCouponType] = useState(coupon.type);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateCoupon(coupon.id, formData);
      toast.success("Coupon updated successfully!");
      router.push("/admin/coupons");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update coupon.");
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

  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toISOString().slice(0, 10) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="type" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Offer Type *</label>
          <select
            id="type"
            name="type"
            value={couponType}
            onChange={(e) => setCouponType(e.target.value)}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
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
          <label htmlFor="code" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Coupon Code *</label>
          <input
            type="text"
            id="code"
            name="code"
            required
            defaultValue={coupon.code}
            className="w-full uppercase font-mono px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Offer Title / Description (Optional)</label>
          <input
            type="text"
            id="description"
            name="description"
            maxLength={120}
            defaultValue={coupon.description || ""}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="discountType" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Discount Type *</label>
          <select
            id="discountType"
            name="discountType"
            defaultValue={coupon.discountType}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="discountValue" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Discount Value *</label>
          <input
            type="number"
            id="discountValue"
            name="discountValue"
            required
            min="0.01"
            step="0.01"
            defaultValue={coupon.discountValue}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="minOrderAmount" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Min. Order Amount (₹)</label>
          <input
            type="number"
            id="minOrderAmount"
            name="minOrderAmount"
            min="0"
            step="0.01"
            defaultValue={coupon.minOrderAmount}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUses" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Max Total Uses (Optional)</label>
          <input
            type="number"
            id="maxUses"
            name="maxUses"
            min="1"
            step="1"
            defaultValue={coupon.maxUses ?? ""}
            placeholder="Leave blank for unlimited"
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
          <p className="text-xs text-gray-500">Overall redemption limit across all customers.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUsesPerUser" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Uses Per Customer (Optional)</label>
          <input
            type="number"
            id="maxUsesPerUser"
            name="maxUsesPerUser"
            min="1"
            step="1"
            defaultValue={coupon.maxUsesPerUser ?? ""}
            placeholder={couponType === "SINGLE_USE" ? "1" : "Leave blank for unlimited"}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
          <p className="text-xs text-gray-500">How many times one customer can use this coupon.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="expiresAt" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Expiry Date (Optional)</label>
          <input
            type="date"
            id="expiresAt"
            name="expiresAt"
            defaultValue={fmtDate(coupon.expiresAt)}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 rounded-none"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
