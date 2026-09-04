"use client";
import { useState } from "react";
import { printShippingLabel } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { Printer, Loader2 } from "lucide-react";

export default function PrintLabelButton({ orderId }: { orderId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const url = await printShippingLabel(orderId);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate label.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B] hover:bg-[#B6925B] hover:text-white px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
      <span>Print Label</span>
    </button>
  );
}
