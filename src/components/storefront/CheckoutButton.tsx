"use client";
import { useState } from "react";
import { checkoutCart, validateCouponAction } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Address {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutButton({ isLoggedIn, addresses, subtotal }: { isLoggedIn: boolean; addresses: Address[]; subtotal: number }) {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""
  );

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCoupon(true);
    try {
      const result = await validateCouponAction(code, subtotal);
      
      let calculatedDiscount = 0;
      if (result.type === "FIXED") {
        calculatedDiscount = result.value;
      } else {
        calculatedDiscount = subtotal * (result.value / 100);
      }
      
      setDiscountAmount(calculatedDiscount);
      setAppliedCoupon(result.code);
      toast.success(`Coupon ${result.code} applied successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
    toast.success("Coupon removed.");
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await checkoutCart(selectedAddressId, appliedCoupon || undefined);
      toast.success("Order placed successfully!");
      router.push(`/order-confirmation/${result.orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  // Calculations
  const gstAmount = subtotal * 0.18; // 18% inclusive GST
  const finalTotal = Math.max(subtotal - discountAmount, 0);

  const getDeliveryDateRange = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 3);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 5);
    
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${minDate.toLocaleDateString("en-US", options)} - ${maxDate.toLocaleDateString("en-US", options)}`;
  };

  const hasNoAddresses = isLoggedIn && addresses.length === 0;

  return (
    <div className="bg-white border border-[#B6925B]/20 p-8 sticky top-32 space-y-6">
      <h3 className="text-lg font-serif font-bold text-[#4A3B2C] border-b border-[#B6925B]/20 pb-4">Order Summary</h3>
      
      {/* Pricing Details */}
      <div className="space-y-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rs. {subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>GST (18% Inclusive)</span>
          <span>Rs. {gstAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="uppercase tracking-widest text-[10px] font-bold text-green-700">Complimentary</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Discount ({appliedCoupon})</span>
            <span>-Rs. {discountAmount.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Delivery Estimate */}
      <div className="bg-[#FAFAFA] p-3.5 border border-[#B6925B]/10 text-xs text-[#4A3B2C] font-medium text-center">
        Estimated Delivery: <span className="font-bold">{getDeliveryDateRange()}</span>
      </div>

      {/* Promo Code Input */}
      {isLoggedIn && (
        <div className="pt-4 border-t border-[#B6925B]/20">
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-3">
            Promo Code
          </label>
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
                className="flex-1 bg-transparent border border-[#B6925B]/20 px-3 py-2 text-xs focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] uppercase rounded-none"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponInput.trim()}
                className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center rounded-none"
              >
                {isValidatingCoupon ? <i className="ri-loader-4-line animate-spin text-base" /> : "Apply"}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Shipping Address Selector */}
      {isLoggedIn && (
        <div className="pt-4 border-t border-[#B6925B]/20 text-left space-y-3">
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
            Shipping Address
          </label>
          
          {hasNoAddresses ? (
            <div className="bg-[#FAFAFA] border border-[#B6925B]/20 p-4 text-xs text-[#4A3B2C] space-y-2 rounded-none">
              <p>You have no saved addresses. Please add a shipping address in your account to continue.</p>
              <a href="/account" className="inline-block underline font-bold uppercase tracking-wider text-[#B6925B]">
                Go to Account Dashboard →
              </a>
            </div>
          ) : (
            <select
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="w-full bg-transparent border border-[#B6925B]/20 px-3 py-2.5 text-sm focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} ({a.addressLine1}, {a.city})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Final Total and Action */}
      <div className="border-t border-[#B6925B]/20 pt-6 flex justify-between items-end">
        <span className="text-sm font-bold uppercase tracking-widest text-[#4A3B2C]">Total</span>
        <span className="text-2xl text-[#4A3B2C] font-bold">Rs. {finalTotal.toLocaleString('en-IN')}</span>
      </div>

      <button 
        onClick={handleCheckout}
        disabled={isProcessing || hasNoAddresses}
        className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-50 rounded-none"
      >
        {isProcessing ? (
          <i className="ri-loader-4-line animate-spin text-lg" />
        ) : (
          isLoggedIn ? "Place Order" : "Log in to Checkout"
        )}
      </button>
    </div>
  );
}
