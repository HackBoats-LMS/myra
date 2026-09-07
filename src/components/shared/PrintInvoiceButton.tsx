"use client";
import { Download, Printer } from "lucide-react";

interface PrintInvoiceButtonProps {
  orderId?: string;
  label?: string;
  isDelivered?: boolean;
}

export default function PrintInvoiceButton({
  orderId,
  label,
  isDelivered = false,
}: PrintInvoiceButtonProps) {
  const handleClick = () => {
    if (orderId) {
      window.open(`/account/orders/${orderId}/invoice`, "_blank");
    } else {
      window.print();
    }
  };

  const buttonLabel = label || (isDelivered ? "Download Invoice" : "Print Invoice");

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 bg-[#2D1F2F] hover:bg-[#220510] text-white px-4 sm:px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-sm print:hidden rounded-none flex-1 sm:flex-initial"
    >
      {isDelivered ? (
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      ) : (
        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      )}
      <span>{buttonLabel}</span>
    </button>
  );
}
