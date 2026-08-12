"use client";
import { useState } from "react";
import { updateOrderInternalNotes } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4 print:hidden">
      <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
        <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Internal Order Notes</h3>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add private staff comments regarding shipping updates, customer special requests, or return logs..."
        className="w-full min-h-[100px] bg-white border border-gray-200 rounded p-3 text-xs focus:outline-none focus:border-[#0D3B66] text-gray-900 placeholder-gray-400 font-normal leading-relaxed"
      />
      <div className="flex justify-end pt-1">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-[#0D3B66] hover:bg-[#082a4d] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          {loading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
          <span>Save Note</span>
        </button>
      </div>
    </div>
  );
}
