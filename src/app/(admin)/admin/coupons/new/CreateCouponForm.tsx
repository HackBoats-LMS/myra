"use client";
import { useState } from "react";
import { createCoupon } from "@/actions/coupons";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function CreateCouponForm() {
  const [loading, setLoading] = useState(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="code" className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Coupon Code *</label>
          <input
            type="text"
            id="code"
            name="code"
            required
            placeholder="e.g. SUMMER20"
            className="w-full uppercase font-mono px-4 py-2 border border-gray-300 rounded-md focus:ring-[#0D3B66] focus:border-[#0D3B66]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="discountType" className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Discount Type *</label>
          <select
            id="discountType"
            name="discountType"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#0D3B66] focus:border-[#0D3B66]"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="discountValue" className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Discount Value *</label>
          <input
            type="number"
            id="discountValue"
            name="discountValue"
            required
            min="0.01"
            step="0.01"
            placeholder="e.g. 20"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#0D3B66] focus:border-[#0D3B66]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="minOrderAmount" className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Min. Order Amount (₹)</label>
          <input
            type="number"
            id="minOrderAmount"
            name="minOrderAmount"
            min="0"
            step="0.01"
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#0D3B66] focus:border-[#0D3B66]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUses" className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Max Uses (Optional)</label>
          <input
            type="number"
            id="maxUses"
            name="maxUses"
            min="1"
            step="1"
            placeholder="Leave blank for unlimited"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#0D3B66] focus:border-[#0D3B66]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expiresAt" className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Expiry Date (Optional)</label>
          <input
            type="date"
            id="expiresAt"
            name="expiresAt"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#0D3B66] focus:border-[#0D3B66]"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0D3B66] hover:bg-[#0a2c4c] text-white px-6 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}
