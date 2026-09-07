"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";

interface PaymentStepProps {
  paymentMethod: "COD" | "RAZORPAY";
  setPaymentMethod: (m: "COD" | "RAZORPAY") => void;
  isCodAvailable?: boolean;
  isCheckingCod?: boolean;
}

export default function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  isCodAvailable = true,
  isCheckingCod = false,
}: PaymentStepProps) {
  const optionCls = (selected: boolean) =>
    `flex items-start justify-between gap-3 p-4 border transition-all rounded-none ${
      selected ? "border-[#7A0B2E] bg-[#7A0B2E]/5 shadow-sm" : "border-[#7A0B2E]/30 bg-white hover:border-[#7A0B2E]/60"
    }`;

  return (
    <div className="bg-white border border-[#7A0B2E]/20 p-6 text-left space-y-5">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-3">
        <h3 className="text-base font-serif font-bold text-[#2D1F2F]">
          Payment Method
        </h3>
        <span className="flex items-center gap-1 text-[11px] text-[#7A0B2E] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
        </span>
      </div>

      <div className="space-y-3">
        {/* Online Payment (Razorpay / UPI / Cards) */}
        <label className={`${optionCls(paymentMethod === "RAZORPAY")} cursor-pointer block`}>
          <div className="flex items-start gap-3 w-full">
            <input
              type="radio"
              name="payment-method"
              value="RAZORPAY"
              checked={paymentMethod === "RAZORPAY"}
              onChange={() => setPaymentMethod("RAZORPAY")}
              className="accent-[#7A0B2E] mt-1"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#2D1F2F] tracking-wide">
                  Online Payment (UPI, Cards & NetBanking)
                </span>
                <span className="text-[10px] bg-[#7A0B2E] text-white font-bold px-2 py-0.5 tracking-wider uppercase">
                  Fastest & Recommended
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* UPI */}
                <div className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center justify-center shadow-xs h-6.5" title="UPI">
                  <Image src="/icons/upi.svg" alt="UPI" width={48} height={14} className="h-3.5 w-auto object-contain" />
                </div>
                {/* RuPay */}
                <div className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center justify-center shadow-xs h-6.5" title="RuPay">
                  <Image src="/icons/rupay.svg" alt="RuPay" width={48} height={14} className="h-3 w-auto object-contain" />
                </div>
                {/* Visa */}
                <div className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center justify-center shadow-xs h-6.5" title="Visa">
                  <Image src="/icons/visa.svg" alt="Visa" width={38} height={14} className="h-3 w-auto object-contain" />
                </div>
                {/* Mastercard */}
                <div className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center justify-center shadow-xs h-6.5" title="Mastercard">
                  <Image src="/icons/mastercard.svg" alt="Mastercard" width={28} height={16} className="h-3.5 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </label>

        {/* Cash on Delivery */}
        <label
          className={`flex items-start justify-between gap-3 p-4 border transition-all rounded-none ${
            !isCodAvailable
              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              : paymentMethod === "COD"
              ? "border-[#7A0B2E] bg-[#7A0B2E]/5 shadow-sm cursor-pointer"
              : "border-[#7A0B2E]/30 bg-white hover:border-[#7A0B2E]/60 cursor-pointer"
          }`}
        >
          <div className="flex items-start gap-3 w-full">
            <input
              type="radio"
              name="payment-method"
              value="COD"
              disabled={!isCodAvailable}
              checked={paymentMethod === "COD" && isCodAvailable}
              onChange={() => isCodAvailable && setPaymentMethod("COD")}
              className="accent-[#7A0B2E] mt-1"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#2D1F2F] tracking-wide">
                  Cash on Delivery (COD)
                </span>
                {isCheckingCod ? (
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider animate-pulse">Checking courier...</span>
                ) : !isCodAvailable ? (
                  <span className="text-[10px] text-[#7A0B2E] font-bold uppercase tracking-wider">Unavailable for pincode</span>
                ) : (
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Pay at Doorstep</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center justify-center shadow-xs h-6.5" title="Cash on Delivery">
                  <Image src="/icons/cod.svg" alt="COD" width={38} height={14} className="h-3.5 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
        Pay securely with Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, NetBanking, or COD at doorstep.
      </p>
    </div>
  );
}

