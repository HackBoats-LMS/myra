"use client";
import { useState } from "react";
import { validateCouponAction } from "@/actions/cart";
import { useToast } from "@/components/ui/Toast";
import type { CheckoutPricing, CheckoutShipping } from "./checkout-types";

interface OrderSummarySidebarProps {
  pricing: CheckoutPricing;
  shipping: CheckoutShipping;
  appliedCoupon: string | null;
  appliedCouponType: string | null;
  shippingAmount: number;
  onApplyCoupon: (code: string, type: string, value: number, discount: number) => Promise<void>;
  onRemoveCoupon: () => void;
  shippingFeeLabel?: string;
}

export default function OrderSummarySidebar({
  pricing,
  shipping,
  appliedCoupon,
  appliedCouponType,
  shippingAmount,
  onApplyCoupon,
  onRemoveCoupon,
  shippingFeeLabel,
}: OrderSummarySidebarProps) {
  const toast = useToast();
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const getDeliveryDateRange = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 5);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${minDate.toLocaleDateString("en-US", options)} - ${maxDate.toLocaleDateString("en-US", options)}`;
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setIsValidatingCoupon(true);
    try {
      const result = await validateCouponAction(code, pricing.subtotal);
      let calculatedDiscount = 0;
      if (result.couponType === "SHIPPING") {
        calculatedDiscount = 0;
      } else if (result.type === "FIXED") {
        calculatedDiscount = result.value;
      } else {
        calculatedDiscount = pricing.subtotal * (result.value / 100);
      }
      await onApplyCoupon(result.code, result.couponType || "STANDARD", result.value, calculatedDiscount);
      toast.success(`Coupon ${result.code} applied successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponInput("");
    toast.success("Coupon removed.");
  };

  return (
    <div className="bg-white border border-[#7A0B2E]/20 p-8 sticky top-32 space-y-6">
      <h3 className="text-lg font-serif font-bold text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-4">Order Summary</h3>

      <div className="space-y-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rs. {pricing.subtotal.toLocaleString("en-IN")}</span>
        </div>
        {pricing.taxAmount > 0 && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>GST</span>
            <span>Rs. {pricing.taxAmount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          {shippingAmount === 0 ? (
            <span className="uppercase tracking-widest text-[10px] font-bold text-green-700">
              {shippingFeeLabel || "Free"}
            </span>
          ) : (
            <span>Rs. {shippingAmount.toLocaleString("en-IN")}</span>
          )}
        </div>
        {pricing.discountAmount > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Discount{appliedCoupon ? ` (${appliedCoupon})` : ""}</span>
            <span>-Rs. {pricing.discountAmount.toLocaleString("en-IN")}</span>
          </div>
        )}
        {appliedCouponType === "SHIPPING" && shippingAmount === 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Free Shipping ({appliedCoupon})</span>
            <span>-Rs. {shipping.flatRate.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      <div className="bg-[#FAFAFA] p-3.5 border border-[#7A0B2E]/10 text-xs text-[#2D1F2F] font-medium text-center">
        Estimated Delivery: <span className="font-bold">{getDeliveryDateRange()}</span>
      </div>

      {/* Promo Code */}
      <div className="pt-4 border-t border-[#7A0B2E]/20">
        <label className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-wider mb-3">Promo Code</label>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
            <span className="flex items-center gap-1 font-bold">
              <i className="ri-ticket-2-line text-sm" />
              {appliedCoupon} Applied
            </span>
            <button onClick={handleRemoveCoupon} className="text-red-500 font-bold hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="WELCOME10"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="flex-1 bg-transparent border border-[#7A0B2E]/20 px-3 py-2 text-xs focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F] uppercase rounded-none"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isValidatingCoupon || !couponInput.trim()}
              className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center rounded-none"
            >
              {isValidatingCoupon ? <i className="ri-loader-4-line animate-spin text-base" /> : "Apply"}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[#7A0B2E]/20 pt-6 flex justify-between items-end">
        <span className="text-sm font-bold uppercase tracking-widest text-[#2D1F2F]">Total</span>
        <span className="text-2xl text-[#2D1F2F] font-bold">Rs. {pricing.finalTotal.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
