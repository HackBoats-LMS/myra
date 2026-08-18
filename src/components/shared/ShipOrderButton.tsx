"use client";
import { useState } from "react";
import { shipOrder } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function ShipOrderButton({
  orderId,
  shipped,
}: {
  orderId: string;
  shipped: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (shipped) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
        <i className="ri-truck-line text-sm text-[#B6925B]" />
        Shipped via Shiprocket
      </span>
    );
  }

  const handleShip = async () => {
    if (!confirm("Create this shipment on Shiprocket? This assigns an AWB and charges freight.")) {
      return;
    }
    setLoading(true);
    try {
      await shipOrder(orderId);
      toast.success("Shipment created on Shiprocket!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create shipment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShip}
      disabled={loading}
      className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-truck-line text-sm" />}
      <span>Ship via Shiprocket</span>
    </button>
  );
}
