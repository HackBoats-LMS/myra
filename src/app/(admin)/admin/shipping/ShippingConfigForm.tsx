"use client";
import { useState } from "react";
import { updateShippingConfig } from "@/actions/coupons";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

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
          <label htmlFor="flatRate" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Flat Shipping Rate (₹)</label>
          <input
            type="number"
            id="flatRate"
            name="flatRate"
            required
            min="0"
            step="0.01"
            defaultValue={initial.flatRate}
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
          <p className="text-xs text-gray-500">Charged on orders below the free-shipping threshold.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="freeShippingThreshold" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Free Shipping Above (₹)</label>
          <input
            type="number"
            id="freeShippingThreshold"
            name="freeShippingThreshold"
            required
            min="0"
            step="0.01"
            defaultValue={initial.freeShippingThreshold}
            className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
          />
          <p className="text-xs text-gray-500">Orders at or above this subtotal ship free.</p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#2D1F2F] hover:bg-[#220510] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 rounded-none"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Save Settings</span>
        </button>
      </div>
    </form>
  );
}
