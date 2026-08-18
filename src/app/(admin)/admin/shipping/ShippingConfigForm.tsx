"use client";
import { useState } from "react";
import { updateShippingConfig } from "@/actions/coupons";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Props {
  initial: { flatRate: number; freeShippingThreshold: number };
}

export default function ShippingConfigForm({ initial }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateShippingConfig(formData);
      toast.success("Shipping settings saved!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save shipping settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="flatRate" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Flat Shipping Rate (₹)</label>
          <input
            type="number"
            id="flatRate"
            name="flatRate"
            required
            min="0"
            step="0.01"
            defaultValue={initial.flatRate}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
          <p className="text-xs text-gray-500">Charged on orders below the free-shipping threshold.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="freeShippingThreshold" className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Free Shipping Above (₹)</label>
          <input
            type="number"
            id="freeShippingThreshold"
            name="freeShippingThreshold"
            required
            min="0"
            step="0.01"
            defaultValue={initial.freeShippingThreshold}
            className="w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C]"
          />
          <p className="text-xs text-gray-500">Orders at or above this subtotal ship free.</p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 rounded-none"
        >
          {loading && <i className="ri-loader-4-line animate-spin text-base" />}
          <span>Save Settings</span>
        </button>
      </div>
    </form>
  );
}
