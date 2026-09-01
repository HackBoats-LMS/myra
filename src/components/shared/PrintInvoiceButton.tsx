"use client";
import { Printer } from "lucide-react";

export default function PrintInvoiceButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 bg-[#4A3B2C] hover:bg-[#34291f] text-white px-4 sm:px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-sm print:hidden rounded-none flex-1 sm:flex-initial"
    >
      <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>Print Invoice</span>
    </button>
  );
}

