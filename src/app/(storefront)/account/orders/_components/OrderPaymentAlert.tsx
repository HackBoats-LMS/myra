import PayNowButton from "./PayNowButton";

interface OrderPaymentAlertProps {
  orderId: string;
  totalAmount: number;
}

export default function OrderPaymentAlert({ orderId, totalAmount }: OrderPaymentAlertProps) {
  return (
    <div className="bg-white p-6 border border-[#7A0B2E]/20 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <i className="ri-error-warning-line text-xl text-yellow-600" />
        <h3 className="font-serif text-[#2D1F2F] text-lg tracking-wide">Complete Your Payment</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Your order is reserved but not yet paid. Complete the payment now to confirm it.
      </p>
      <PayNowButton orderId={orderId} amount={totalAmount} />
    </div>
  );
}
