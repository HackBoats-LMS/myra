interface OrderStatusProps {
  orderId: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
}

export default function OrderStatus({ orderId, status, paymentMethod, paymentStatus, awbNumber, trackingUrl }: OrderStatusProps) {
  return (
    <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
      <div>
        <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-2">Status</span>
        <span className={`inline-flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest
          ${status === 'DELIVERED' ? 'bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30' : 
            status === 'SHIPPED' || status === 'READY_TO_SHIP' || status === 'OUT_FOR_DELIVERY' ? 'bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30' : 
            status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' : 
            'bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30'}`}>
          {status}
        </span>
      </div>
      <div>
        <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">Order ID</span>
        <span className="text-sm font-mono text-[#4A3B2C]">{orderId.split('-')[0].toUpperCase()}</span>
      </div>
      <div>
        <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">Payment Method</span>
        <span className="text-sm font-bold text-[#4A3B2C]">
          {paymentMethod === "RAZORPAY" ? "Online (Razorpay)" : "Cash on Delivery"}
          {paymentStatus === "PAID" && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
              Paid
            </span>
          )}
          {paymentStatus === "UNPAID" && paymentMethod === "RAZORPAY" && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-yellow-50 text-yellow-700 border border-yellow-200">
              Unpaid
            </span>
          )}
          {paymentStatus === "REFUNDED" && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200">
              Refunded
            </span>
          )}
        </span>
      </div>
      {awbNumber && (
        <div>
          <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">AWB / Tracking</span>
          <span className="text-sm font-mono text-[#4A3B2C]">{awbNumber}</span>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors"
            >
              Track on Shiprocket <i className="ri-external-link-line text-xs" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
