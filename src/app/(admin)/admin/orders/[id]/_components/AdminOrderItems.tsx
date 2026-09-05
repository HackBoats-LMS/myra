import Image from "next/image";
import RefundButton from "@/app/(admin)/admin/orders/_components/RefundButton";

interface OrderItemEntry {
  id: string;
  quantity: number;
  price: number;
  isCancelled: boolean;
  product: {
    name: string;
    images: string[];
  };
  variant: {
    size: string | null;
    color: string | null;
  } | null;
}

interface AdminOrderItemsProps {
  orderId: string;
  orderItems: OrderItemEntry[];
  totalAmount: number;
  refundedAmount?: number;
  orderStatus: string;
  paymentStatus: string;
}

export default function AdminOrderItems({ orderId, orderItems, totalAmount, refundedAmount = 0, orderStatus, paymentStatus }: AdminOrderItemsProps) {
  const isRefundFailed = orderStatus === "CANCELLED" && paymentStatus === "PAID";

  return (
    <div className="md:col-span-2 bg-white border border-[#7A0B2E]/20 shadow-sm overflow-hidden flex flex-col">
      <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 p-6 pb-4">Order Items</h3>
      
      {isRefundFailed && (
        <div className="bg-red-50 border-b border-red-200 p-4 px-6 flex items-start gap-3">
          <i className="ri-error-warning-line text-red-600 text-lg"></i>
          <div>
            <p className="text-sm font-bold text-red-700">Automated Refund Failed</p>
            <p className="text-xs text-red-600 mt-0.5">The Razorpay API failed to process the automatic refund for this cancelled order. Please use the Issue Refund button below to manually refund the customer.</p>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#7A0B2E]/10">
        {orderItems.map((item) => (
          <div key={item.id} className={`p-6 flex items-center gap-4 ${item.isCancelled ? 'opacity-50' : ''}`}>
            <div className="relative w-16 h-24 bg-[#F5EFE6] border border-[#7A0B2E]/20 overflow-hidden flex-shrink-0">
              {item.product.images[0] && (
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover grayscale-0" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#2D1F2F] text-sm flex items-center gap-2">
                {item.product.name}
                {item.isCancelled && <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 uppercase tracking-widest rounded-none">Cancelled</span>}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Qty: {item.quantity}</p>
            </div>
            <div className={`font-bold text-sm ${item.isCancelled ? 'text-gray-400 line-through' : 'text-[#7A0B2E]'}`}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#F5EFE6] p-6 flex flex-col gap-2 border-t border-[#7A0B2E]/20">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">Total Amount</span>
          <span className="text-xl font-serif text-[#2D1F2F]">₹{totalAmount.toFixed(2)}</span>
        </div>
        
        {refundedAmount > 0 && (
          <div className="flex justify-between items-center text-red-600">
            <span className="text-[10px] font-bold uppercase tracking-widest">Refunded</span>
            <span className="font-bold">-₹{refundedAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#7A0B2E]/10">
          <RefundButton orderId={orderId} totalAmount={totalAmount} refundedAmount={refundedAmount || 0} />
          
          {refundedAmount > 0 && (
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Net Total</span>
              <span className="text-sm font-bold text-[#2D1F2F]">₹{(totalAmount - refundedAmount).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
