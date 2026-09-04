"use client";
import { useState } from "react";
import { updateOrderInternalNotes } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { FileText, Loader2 } from "lucide-react";

export default function OrderInternalNotes({ orderId, initialNotes }: { orderId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOrderInternalNotes(orderId, notes);
      toast.success("Internal notes updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update internal notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border border-[#7A0B2E]/20 shadow-sm space-y-4 print:hidden rounded-none">
      <div className="flex items-center gap-1.5 border-b border-[#7A0B2E]/20 pb-3">
        <FileText className="w-4 h-4 text-[#7A0B2E] shrink-0" />
        <h3 className="font-serif text-[#2D1F2F] text-lg tracking-wide">Internal Order Notes</h3>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add private staff comments regarding shipping updates, customer special requests, or return logs..."
        className="w-full min-h-[100px] bg-white border border-[#7A0B2E]/20 rounded-none p-3 text-xs focus:outline-none focus:border-[#7A0B2E] focus:ring-1 focus:ring-[#7A0B2E] text-[#2D1F2F] placeholder-gray-400 font-normal leading-relaxed"
      />
      <div className="flex justify-end pt-1">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-[#2D1F2F] hover:bg-[#220510] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 rounded-none"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Save Note</span>
        </button>
      </div>
    </div>
  );
}
