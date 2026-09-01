"use client";
import type { CheckoutAddress, CheckoutGift, CheckoutOrderLine, CheckoutPricing } from "./checkout-types";

interface ReviewStepProps {
  lines: CheckoutOrderLine[];
  address: CheckoutAddress | null;
  isGift: boolean;
  gift: CheckoutGift;
  deliveryPhone: string;
  paymentMethod: "COD" | "RAZORPAY";
  pricing: CheckoutPricing;
  isProcessing: boolean;
  onSubmit: () => void;
}

export default function ReviewStep({
  lines,
  address,
  isGift,
  gift,
  deliveryPhone,
  paymentMethod,
  pricing,
  isProcessing,
  onSubmit,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Items */}
      <section className="bg-white border border-[#B6925B]/20 p-6 text-left">
        <h3 className="text-base font-serif font-bold text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3">Your Items</h3>
        <ul className="divide-y divide-[#B6925B]/10">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm text-[#4A3B2C] truncate">{l.name}</span>
                {l.variantLabel && <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{l.variantLabel}</span>}
                <span className="block text-xs text-gray-400 mt-0.5">Qty: {l.quantity}</span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-bold text-[#4A3B2C]">
                  Rs. {(l.unitPrice * l.quantity).toLocaleString("en-IN")}
                </span>
                {l.originalUnitPrice != null && l.originalUnitPrice > l.unitPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    Rs. {(l.originalUnitPrice * l.quantity).toLocaleString("en-IN")}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Delivery */}
      <section className="bg-white border border-[#B6925B]/20 p-6 text-left">
        <h3 className="text-base font-serif font-bold text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3">Delivering To</h3>
        {isGift ? (
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-bold text-[#4A3B2C]">{gift.name}</p>
            {gift.phone && <p className="font-mono text-xs">Phone: {gift.phone}</p>}
            <p className="text-xs">{gift.addressLine1}, {gift.city}, {gift.state} {gift.postalCode}, {gift.country}</p>
          </div>
        ) : address ? (
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-bold text-[#4A3B2C]">{address.label}</p>
            <p className="text-xs">{address.addressLine1}, {address.city}, {address.state} - {address.postalCode}, {address.country}</p>
            {deliveryPhone && <p className="font-mono text-xs">Contact: {deliveryPhone}</p>}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No delivery address set.</p>
        )}
      </section>

      {/* Payment */}
      <section className="bg-white border border-[#B6925B]/20 p-6 text-left">
        <h3 className="text-base font-serif font-bold text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3">Payment</h3>
        <p className="text-sm text-[#4A3B2C] font-bold uppercase tracking-wider">
          {paymentMethod === "RAZORPAY" ? "UPI & Online Payment (Razorpay)" : "Cash on Delivery"}
        </p>
      </section>

      {/* Place order */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold uppercase tracking-widest text-[#4A3B2C]">Total</span>
        <span className="text-2xl text-[#4A3B2C] font-bold">Rs. {pricing.finalTotal.toLocaleString("en-IN")}</span>
      </div>

      <button
        onClick={onSubmit}
        disabled={isProcessing}
        className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-50 rounded-none"
      >
        {isProcessing ? (
          <i className="ri-loader-4-line animate-spin text-lg" />
        ) : paymentMethod === "RAZORPAY" ? (
          "Pay Now"
        ) : (
          "Place Order (Pay at Delivery)"
        )}
      </button>
    </div>
  );
}
