"use client";
import { PrinterIcon } from "@heroicons/react/24/outline";

export default function PrintInvoiceButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors shadow-sm flex items-center gap-1.5 print:hidden"
    >
      <PrinterIcon className="w-4 h-4" />
      Print Invoice
    </button>
  );
}
