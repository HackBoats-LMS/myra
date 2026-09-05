"use client";
import { useState } from "react";
import { updateShippingConfig } from "@/actions/coupons";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

interface Props {
  initial: {
    flatRate: number;
    freeShippingThreshold: number;
    codFlatRate: number;
    codFreeShippingThreshold: number;
    codHandlingFee: number;
  };
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
      toast.success("Shipping & COD settings saved successfully!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save shipping settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Online / Prepaid Delivery Settings */}
      <div className="space-y-4">
        <div className="border-b border-[#7A0B2E]/15 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D1F2F] flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#7A0B2E] inline-block" />
            Online / Prepaid Delivery (UPI & Cards)
          </h3>
          <p className="text-xs text-gray-500 mt-1">Delivery fees applied when customers pay online via Razorpay/UPI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="flatRate" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
              Online Delivery Fee (₹)
            </label>
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
            <p className="text-xs text-gray-500">Charged on online orders below the free-shipping threshold.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="freeShippingThreshold" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
              Online Free Delivery Above (₹)
            </label>
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
            <p className="text-xs text-gray-500">Orders at or above this subtotal get free delivery.</p>
          </div>
        </div>
      </div>

      {/* 2. Cash on Delivery (COD) Settings */}
      <div className="space-y-4 pt-2 border-t border-[#7A0B2E]/15">
        <div className="border-b border-[#7A0B2E]/15 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D1F2F] flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#2D1F2F] inline-block" />
            Cash on Delivery (COD) Settings
          </h3>
          <p className="text-xs text-gray-500 mt-1">Delivery rates and additional handling charges for cash on delivery orders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="codFlatRate" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
              COD Delivery Fee (₹)
            </label>
            <input
              type="number"
              id="codFlatRate"
              name="codFlatRate"
              required
              min="0"
              step="0.01"
              defaultValue={initial.codFlatRate}
              className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
            />
            <p className="text-xs text-gray-500">Base shipping charged on COD orders below threshold.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="codFreeShippingThreshold" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
              COD Free Delivery Above (₹)
            </label>
            <input
              type="number"
              id="codFreeShippingThreshold"
              name="codFreeShippingThreshold"
              required
              min="0"
              step="0.01"
              defaultValue={initial.codFreeShippingThreshold}
              className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
            />
            <p className="text-xs text-gray-500">Subtotal required for free delivery on COD.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="codHandlingFee" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
              COD Handling Fee (₹)
            </label>
            <input
              type="number"
              id="codHandlingFee"
              name="codHandlingFee"
              required
              min="0"
              step="0.01"
              defaultValue={initial.codHandlingFee}
              className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F]"
            />
            <p className="text-xs text-gray-500">Fixed convenience fee added to all COD orders (set 0 for none).</p>
          </div>
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
