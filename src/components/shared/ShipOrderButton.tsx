"use client";
import { useState } from "react";
import { shipOrder } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Truck, Loader2 } from "lucide-react";

import PrintLabelButton from "./PrintLabelButton";

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
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1.5 bg-[#FAFAFA] text-[#2D1F2F] border border-[#7A0B2E]/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
          <Truck className="w-4 h-4 text-[#7A0B2E]" />
          Shipped via Shiprocket
        </span>
        <PrintLabelButton orderId={orderId} />
      </div>
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
      className="bg-[#2D1F2F] hover:bg-[#220510] text-white px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
      <span>Ship via Shiprocket</span>
    </button>
  );
}
