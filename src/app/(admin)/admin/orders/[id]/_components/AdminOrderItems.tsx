import Image from "next/image";
import RefundButton from "@/app/(admin)/admin/orders/_components/RefundButton";

interface AdminOrderItemsProps {
  orderId: string;
  orderItems: any[];
  totalAmount: number;
  refundedAmount: number;
}

export default function AdminOrderItems({ orderId, orderItems, totalAmount, refundedAmount }: AdminOrderItemsProps) {
  return (
    <div className="md:col-span-2 bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden">
      <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 p-6 pb-4">Order Items</h3>
      
      <div className="divide-y divide-[#B6925B]/10">
        {orderItems.map((item) => (
          <div key={item.id} className="p-6 flex items-center gap-4">
            <div className="relative w-16 h-24 bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0">
              {item.product.images[0] && (
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#4A3B2C] text-sm">{item.product.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Qty: {item.quantity}</p>
            </div>
            <div className="font-bold text-[#B6925B] text-sm">
              ₹{(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FAFAFA] p-6 flex flex-col gap-2 border-t border-[#B6925B]/20">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Total Amount</span>
          <span className="text-xl font-serif text-[#4A3B2C]">₹{totalAmount.toFixed(2)}</span>
        </div>
        
        {refundedAmount > 0 && (
          <div className="flex justify-between items-center text-red-600">
            <span className="text-[10px] font-bold uppercase tracking-widest">Refunded</span>
            <span className="font-bold">-₹{refundedAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#B6925B]/10">
          <RefundButton orderId={orderId} totalAmount={totalAmount} refundedAmount={refundedAmount || 0} />
          
          {refundedAmount > 0 && (
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Net Total</span>
              <span className="text-sm font-bold text-[#4A3B2C]">₹{(totalAmount - refundedAmount).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
