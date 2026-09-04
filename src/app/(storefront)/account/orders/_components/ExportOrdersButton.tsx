"use client";
import { useState } from "react";
import { exportOrdersCsv } from "@/actions/account";
import { useToast } from "@/components/ui/Toast";

export default function ExportOrdersButton() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { csv, filename } = await exportOrdersCsv();
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Orders exported.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 border border-[#7A0B2E]/40 text-[#2D1F2F] hover:bg-[#7A0B2E] hover:text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-none disabled:opacity-50"
    >
      <i className={`${loading ? "ri-loader-4-line animate-spin" : "ri-download-2-line"} text-sm`} />
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}
