"use client";
import { Printer } from "lucide-react";

export default function PrintInvoiceButton({ orderId }: { orderId?: string }) {
  const handleClick = () => {
    if (orderId) {
      window.open(`/account/orders/${orderId}/invoice`, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 bg-[#2D1F2F] hover:bg-[#220510] text-white px-4 sm:px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-sm print:hidden rounded-none flex-1 sm:flex-initial"
    >
      <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>Print Invoice</span>
    </button>
  );
}

