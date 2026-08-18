"use client";

export default function PrintInvoiceButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm flex items-center gap-2 print:hidden rounded-none"
    >
      <i className="ri-printer-line text-sm leading-none" />
      Print Invoice
    </button>
  );
}
