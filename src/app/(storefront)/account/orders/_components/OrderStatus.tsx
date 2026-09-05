import { ExternalLink, CreditCard } from "lucide-react";

interface OrderStatusProps {
  orderId: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
}

export default function OrderStatus({ orderId, status, paymentMethod, paymentStatus, awbNumber, trackingUrl }: OrderStatusProps) {
  const shortId = orderId.split('-')[0].toUpperCase();

  return (
    <div className="bg-white p-5 sm:p-6 border border-[#7A0B2E]/20 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#7A0B2E]" />
          <h3 className="font-serif text-[#2D1F2F] text-base sm:text-lg tracking-wide">
            Order Status
          </h3>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            status === "DELIVERED"
              ? "bg-green-50 text-green-700 border border-green-200"
              : status === "CANCELLED"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-[#F5EFE6] text-[#7A0B2E] border border-[#7A0B2E]/30"
          }`}
        >
          {status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="space-y-3.5 divide-y divide-[#7A0B2E]/10">
        <div className="pt-0.5">
          <span className="block text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest mb-1">
            Order Reference
          </span>
          <span className="text-sm font-mono font-bold text-[#2D1F2F]">#{shortId}</span>
        </div>

        <div className="pt-3">
          <span className="block text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest mb-1.5">
            Payment Method
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#2D1F2F]">
              {paymentMethod === "RAZORPAY" ? "Online Payment (Razorpay)" : "Cash on Delivery"}
            </span>
            {paymentStatus === "PAID" && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
                Paid
              </span>
            )}
            {paymentStatus === "UNPAID" && paymentMethod === "RAZORPAY" && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-200">
                Unpaid
              </span>
            )}
            {paymentStatus === "REFUNDED" && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200">
                Refunded
              </span>
            )}
          </div>
        </div>

        {awbNumber && (
          <div className="pt-3">
            <span className="block text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest mb-1">
              Courier AWB
            </span>
            <p className="text-sm font-mono font-bold text-[#2D1F2F]">{awbNumber}</p>
            <a
              href={trackingUrl || `https://shiprocket.co/tracking/${awbNumber}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#2D1F2F] underline underline-offset-2 transition-colors"
            >
              <span>Track on Shiprocket</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

