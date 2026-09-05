"use client";

interface PaymentStepProps {
  paymentMethod: "COD" | "RAZORPAY";
  setPaymentMethod: (m: "COD" | "RAZORPAY") => void;
}

export default function PaymentStep({ paymentMethod, setPaymentMethod }: PaymentStepProps) {
  const optionCls = (selected: boolean) =>
    `flex items-center justify-between gap-3 px-3 py-2.5 border cursor-pointer transition-colors rounded-none ${
      selected ? "border-[#7A0B2E] bg-[#7A0B2E]/5" : "border-[#7A0B2E]/30 bg-white"
    }`;

  return (
    <div className="bg-white border border-[#7A0B2E]/20 p-6 text-left space-y-4">
      <h3 className="text-base font-serif font-bold text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-3">
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
              className="accent-[#7A0B2E]"
            />
            <span className="text-xs font-bold text-[#2D1F2F] uppercase tracking-wider">Cash on Delivery</span>
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
                className="accent-[#7A0B2E]"
              />
              <span className="text-xs font-bold text-[#2D1F2F] uppercase tracking-wider">
                UPI & Online Payment <span className="text-[#7A0B2E]">(Razorpay)</span>
              </span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 pl-5">
              <span className="inline-block bg-[#F5EFE6] border border-[#7A0B2E]/30 text-[#2D1F2F] text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                UPI (GPay / PhonePe / Paytm / QR)
              </span>
              <span className="inline-block bg-[#F5EFE6] border border-[#7A0B2E]/20 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                Cards
              </span>
              <span className="inline-block bg-[#F5EFE6] border border-[#7A0B2E]/20 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                NetBanking
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[#7A0B2E] font-bold uppercase tracking-widest hidden sm:inline">Instant</span>
        </label>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed pt-2">
        Pay securely with UPI (Google Pay, PhonePe, Paytm, UPI QR, UPI ID), Credit/Debit Cards, or Net Banking via Razorpay.
      </p>
    </div>
  );
}
