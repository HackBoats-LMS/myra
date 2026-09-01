"use client";

interface PaymentStepProps {
  paymentMethod: "COD" | "RAZORPAY";
  setPaymentMethod: (m: "COD" | "RAZORPAY") => void;
}

export default function PaymentStep({ paymentMethod, setPaymentMethod }: PaymentStepProps) {
  const optionCls = (selected: boolean) =>
    `flex items-center justify-between gap-3 px-3 py-2.5 border cursor-pointer transition-colors rounded-none ${
      selected ? "border-[#B6925B] bg-[#B6925B]/5" : "border-[#B6925B]/30 bg-white"
    }`;

  return (
    <div className="bg-white border border-[#B6925B]/20 p-6 text-left space-y-4">
      <h3 className="text-base font-serif font-bold text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3">
        Payment Method
      </h3>

      <div className="space-y-2">
        <label className={optionCls(paymentMethod === "COD")}>
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="payment-method"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              className="accent-[#B6925B]"
            />
            <span className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">Cash on Delivery</span>
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pay at doorstep</span>
        </label>

        <label className={optionCls(paymentMethod === "RAZORPAY")}>
          <div className="flex flex-col gap-1.5 py-1">
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="payment-method"
                value="RAZORPAY"
                checked={paymentMethod === "RAZORPAY"}
                onChange={() => setPaymentMethod("RAZORPAY")}
                className="accent-[#B6925B]"
              />
              <span className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
                UPI & Online Payment <span className="text-[#B6925B]">(Razorpay)</span>
              </span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pl-5">
              <span className="inline-block bg-[#FAFAFA] border border-[#B6925B]/30 text-[#4A3B2C] text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                UPI (GPay / PhonePe / Paytm / QR)
              </span>
              <span className="inline-block bg-[#FAFAFA] border border-[#B6925B]/20 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                Cards
              </span>
              <span className="inline-block bg-[#FAFAFA] border border-[#B6925B]/20 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                NetBanking
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[#B6925B] font-bold uppercase tracking-widest hidden sm:inline">Instant</span>
        </label>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed pt-2">
        Pay securely with UPI (Google Pay, PhonePe, Paytm, UPI QR, UPI ID), Credit/Debit Cards, or Net Banking via Razorpay.
      </p>
    </div>
  );
}
