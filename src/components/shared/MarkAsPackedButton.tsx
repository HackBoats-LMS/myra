
"use client";
import { useState } from "react";
import { markOrderAsPacked } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { PackageCheck, Loader2 } from "lucide-react";

export default function MarkAsPackedButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handlePack = async () => {
    if (!confirm("Have you successfully packed all items in the box? This will mark the order as ready to ship.")) {
      return;
    }
    setLoading(true);
    try {
      await markOrderAsPacked(orderId);
      toast.success("Order marked as packed and ready to ship!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as packed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePack}
      disabled={loading}
      className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
      <span>Mark as Packed</span>
    </button>
  );
}
