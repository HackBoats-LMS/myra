"use client";
import { useEffect, useRef, useState } from "react";
import { checkoutCart, validateCouponAction } from "@/actions/cart";
import { initiateRazorpayPayment, confirmRazorpayPayment } from "@/actions/payment";
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
  phone?: string | null;
  isDefault: boolean;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
};

interface RazorpayWindow {
  Razorpay?: RazorpayConstructor;
}

export default function CheckoutButton({ isLoggedIn, addresses, subtotal, shipping, phones = [] }: {
  isLoggedIn: boolean;
  addresses: Address[];
  subtotal: number;
  shipping: { flatRate: number; freeShippingThreshold: number };
  phones: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setIsAddressOpen(false);
      }
    }
    if (isAddressOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddressOpen]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Coupon States
  const [selectedPhone, setSelectedPhone] = useState(phones[0] || "");
  const [phoneError, setPhoneError] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [gift, setGift] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [giftError, setGiftError] = useState("");
  const [couponInput, setCouponInput] = useState(() => {
    try {
      return localStorage.getItem("myra_coupon") || "";
    } catch {
      return "";
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [appliedCouponType, setAppliedCouponType] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Shipping: free when subtotal meets threshold or a shipping coupon is applied.
  const freeShipping = appliedCouponType === "SHIPPING" || subtotal >= shipping.freeShippingThreshold;
  const shippingAmount = freeShipping ? 0 : shipping.flatRate;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCoupon(true);
    try {
      const result = await validateCouponAction(code, subtotal);

      let calculatedDiscount = 0;
      if (result.couponType === "SHIPPING") {
        calculatedDiscount = 0; // discount handled via free shipping
      } else if (result.type === "FIXED") {
        calculatedDiscount = result.value;
      } else {
        calculatedDiscount = subtotal * (result.value / 100);
      }

      setDiscountAmount(calculatedDiscount);
      setAppliedCouponType(result.couponType || null);
      setAppliedCoupon(result.code);
      try {
        localStorage.setItem("myra_coupon", result.code);
      } catch {
        /* ignore */
      }
      toast.success(`Coupon ${result.code} applied successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponType(null);
    setDiscountAmount(0);
    setCouponInput("");
    try {
      localStorage.removeItem("myra_coupon");
    } catch {
      /* ignore */
    }
    toast.success("Coupon removed.");
  };

  const loadRazorpayScript = (): Promise<void> =>
    new Promise((resolve) => {
      if (typeof (window as RazorpayWindow).Razorpay !== "undefined") return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });

  const openRazorpayModal = async (options: {
    keyId: string;
    amount: number;
    currency: string;
    razorpayOrderId: string;
    orderId: string;
  }) => {
    await loadRazorpayScript();
    const Rzr = (window as RazorpayWindow).Razorpay;
    if (!Rzr) {
      setIsProcessing(false);
      toast.error("Payment gateway failed to load. Please try again.");
      return;
    }

    const rzp = new Rzr({
      key: options.keyId,
      amount: options.amount,
      currency: options.currency,
      name: "Myra",
      description: `Order #${options.orderId.substring(0, 8)}`,
      order_id: options.razorpayOrderId,
      prefill: {
        name: isGift ? gift.name : undefined,
        email: undefined,
        contact: isGift ? gift.phone : selectedPhone.trim(),
      },
      theme: { color: "#B6925B" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const { orderId } = await confirmRazorpayPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          toast.success("Payment successful! Order placed.");
          router.push(`/order-confirmation/${orderId}`);
        } catch (error) {
          setIsProcessing(false);
          toast.error(error instanceof Error ? error.message : "Payment could not be confirmed.");
        }
      },
      modal: {
        ondismiss: () => setIsProcessing(false),
      },
    });

    rzp.open();
  };

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    if (!isGift && !selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }

    let giftPayload;
    if (isGift) {
      const g = {
        name: gift.name.trim(),
        phone: gift.phone.trim(),
        addressLine1: gift.addressLine1.trim(),
        city: gift.city.trim(),
        state: gift.state.trim(),
        postalCode: gift.postalCode.trim(),
        country: gift.country.trim(),
      };
      if (!/^\d{10}$/.test(g.phone)) {
        setGiftError("Please enter a valid 10-digit recipient phone number.");
        toast.error("A valid recipient phone number is required.");
        return;
      }
      if (!g.name || !g.addressLine1 || !g.city || !g.state || !g.postalCode || !g.country) {
        setGiftError("Please fill in all recipient details and address fields.");
        toast.error("Please complete the recipient details and address.");
        return;
      }
      setGiftError("");
      giftPayload = g;
    } else {
      const phone = selectedPhone.trim();
      if (!/^\d{10}$/.test(phone)) {
        setPhoneError("Please enter a valid 10-digit phone number.");
        toast.error("A valid phone number is required to place your order.");
        return;
      }
      setPhoneError("");
    }

    setIsProcessing(true);
    try {
      const deliveryPhone = isGift ? undefined : selectedPhone.trim() || undefined;

      if (paymentMethod === "RAZORPAY") {
        const payment = await initiateRazorpayPayment({
          addressId: isGift ? "" : selectedAddressId,
          couponCode: appliedCoupon || undefined,
          phone: deliveryPhone,
          gift: giftPayload,
        });
        await openRazorpayModal({
          keyId: payment.keyId,
          amount: payment.amount,
          currency: payment.currency,
          razorpayOrderId: payment.razorpayOrderId,
          orderId: payment.orderId,
        });
        return;
      }

      const result = await checkoutCart(
        isGift ? "" : selectedAddressId,
        appliedCoupon || undefined,
        deliveryPhone,
        giftPayload
      );
      toast.success("Order placed successfully!");
      router.push(`/order-confirmation/${result.orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  // Calculations
  const gstAmount = subtotal * 0.18; // 18% inclusive GST
  const finalTotal = Math.max(subtotal - discountAmount + shippingAmount, 0);

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
          {shippingAmount === 0 ? (
            <span className="uppercase tracking-widest text-[10px] font-bold text-green-700">Free</span>
          ) : (
            <span>Rs. {shippingAmount.toLocaleString('en-IN')}</span>
          )}
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Discount ({appliedCoupon})</span>
            <span>-Rs. {discountAmount.toLocaleString('en-IN')}</span>
          </div>
        )}
        {appliedCouponType === "SHIPPING" && shippingAmount === 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Free Shipping ({appliedCoupon})</span>
            <span>-Rs. {shipping.flatRate.toLocaleString('en-IN')}</span>
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
      
      {/* Ship to someone else / Gift toggle */}
      {isLoggedIn && (
        <div className="pt-4 border-t border-[#B6925B]/20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => {
                setIsGift(e.target.checked);
                setGiftError("");
              }}
              className="w-4 h-4 accent-[#B6925B]"
            />
            <span className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
              This is a gift — ship to someone else
            </span>
          </label>
        </div>
      )}

      {isLoggedIn && isGift && (
        <div className="pt-4 border-t border-[#B6925B]/20 text-left space-y-3">
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
            Recipient Details *
          </label>
          <input
            type="text"
            placeholder="Recipient name"
            value={gift.name}
            onChange={(e) => setGift({ ...gift, name: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
          />
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Recipient phone (10 digits)"
            value={gift.phone}
            onChange={(e) => setGift({ ...gift, phone: e.target.value.replace(/\D/g, "") })}
            className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
          />
          <input
            type="text"
            placeholder="Address line"
            value={gift.addressLine1}
            onChange={(e) => setGift({ ...gift, addressLine1: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="City"
              value={gift.city}
              onChange={(e) => setGift({ ...gift, city: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
            />
            <input
              type="text"
              placeholder="State"
              value={gift.state}
              onChange={(e) => setGift({ ...gift, state: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
            />
            <input
              type="text"
              placeholder="Postal code"
              value={gift.postalCode}
              onChange={(e) => setGift({ ...gift, postalCode: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
            />
            <input
              type="text"
              placeholder="Country"
              value={gift.country}
              onChange={(e) => setGift({ ...gift, country: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#B6925B]/30 focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none"
            />
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Your order will be delivered to this recipient&rsquo;s address. This address is not saved to your account.
          </p>
          {giftError && <p className="text-[11px] text-red-600 font-medium">{giftError}</p>}
        </div>
      )}

      {/* Delivery contact number */}
      {isLoggedIn && !isGift && (
        <div className="pt-4 border-t border-[#B6925B]/20 text-left space-y-3">
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
            Delivery Contact *
          </label>
          {phones.length > 0 ? (
            <div className="space-y-2">
              {phones.map((ph, idx) => (
                <label
                  key={ph}
                  className={`flex items-center justify-between gap-3 px-3 py-2 border cursor-pointer transition-colors rounded-none ${
                    selectedPhone === ph ? "border-[#B6925B] bg-[#B6925B]/5" : "border-[#B6925B]/30 bg-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delivery-phone"
                      value={ph}
                      checked={selectedPhone === ph}
                      onChange={() => {
                        setSelectedPhone(ph);
                        setPhoneError("");
                      }}
                      className="accent-[#B6925B]"
                    />
                    <span className="text-xs font-mono text-[#4A3B2C]">{ph}</span>
                  </span>
                  {idx === 0 && <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Primary</span>}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={selectedPhone}
              onChange={(e) => {
                setSelectedPhone(e.target.value.replace(/\D/g, ""));
                setPhoneError("");
              }}
              placeholder="e.g. 9876543210"
              className={`w-full px-3 py-2 text-xs focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] rounded-none border ${phoneError ? "border-red-400" : "border-[#B6925B]/30"}`}
            />
          )}
          <p className="text-[10px] text-gray-500 leading-relaxed">
            We use this number to confirm and deliver your order.
          </p>
          {phoneError && <p className="text-[11px] text-red-600 font-medium">{phoneError}</p>}
        </div>
      )}

      {/* Shipping Address Selector */}
      {isLoggedIn && !isGift && (
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
            <div ref={addressRef} className="relative">
              {/* Dropdown trigger */}
              <button
                type="button"
                onClick={() => setIsAddressOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-3 bg-[#FAFAFA] border border-[#B6925B]/30 px-3.5 py-3 text-left focus:outline-none focus:border-[#B6925B] transition-colors rounded-none"
                aria-haspopup="listbox"
                aria-expanded={isAddressOpen}
              >
                <span className="min-w-0">
                  {selectedAddress ? (
                    <>
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">{selectedAddress.label}</span>
                        {selectedAddress.isDefault && (
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-[#4A3B2C] text-white px-1.5 py-0.5">Default</span>
                        )}
                      </span>
                      <span className="block text-xs text-[#4A3B2C] truncate mt-1">
                        {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                      </span>
                      {selectedAddress.phone && (
                        <span className="block text-[10px] text-[#B6925B] font-mono mt-0.5">
                          {selectedAddress.phone}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Select a delivery address</span>
                  )}
                </span>
                <i className={`ri-arrow-down-s-line text-lg text-[#B6925B] transition-transform ${isAddressOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown panel */}
              {isAddressOpen && (
                <ul
                  role="listbox"
                  className="absolute left-0 right-0 top-full mt-2 z-20 bg-white border border-[#B6925B]/20 shadow-xl max-h-72 overflow-y-auto rounded-none"
                >
                  {addresses.map((a) => {
                    const isSelected = a.id === selectedAddressId;
                    return (
                      <li key={a.id} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(a.id);
                            setIsAddressOpen(false);
                          }}
                          className={`w-full flex items-start justify-between gap-3 px-3.5 py-3 text-left border-b border-[#B6925B]/10 last:border-b-0 transition-colors rounded-none ${isSelected ? "bg-[#B6925B]/10" : "hover:bg-[#FAFAFA]"}`}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">{a.label}</span>
                              {a.isDefault && (
                                <span className="text-[8px] font-bold uppercase tracking-widest bg-[#4A3B2C] text-white px-1.5 py-0.5">Default</span>
                              )}
                            </span>
                            <span className="block text-xs text-gray-600 mt-0.5">
                              {a.addressLine1}, {a.city}, {a.state} - {a.postalCode}
                            </span>
                            {a.phone && (
                              <span className="block text-[10px] text-[#B6925B] font-mono mt-0.5">{a.phone}</span>
                            )}
                          </span>
                          <span className={`flex-shrink-0 mt-0.5 ${isSelected ? "text-[#B6925B]" : "text-transparent"}`}>
                            <i className="ri-check-line text-lg" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Method */}
      <div className="pt-4 border-t border-[#B6925B]/20 text-left space-y-3">
        <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
          Payment Method
        </label>
        <div className="space-y-2">
          <label
            className={`flex items-center justify-between gap-3 px-3 py-2.5 border cursor-pointer transition-colors rounded-none ${
              paymentMethod === "COD" ? "border-[#B6925B] bg-[#B6925B]/5" : "border-[#B6925B]/30 bg-white"
            }`}
          >
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

          <label
            className={`flex items-center justify-between gap-3 px-3 py-2.5 border cursor-pointer transition-colors rounded-none ${
              paymentMethod === "RAZORPAY" ? "border-[#B6925B] bg-[#B6925B]/5" : "border-[#B6925B]/30 bg-white"
            }`}
          >
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
                Online Payment <span className="text-[#B6925B]">(Razorpay)</span>
              </span>
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              UPI / Card / NetBanking
            </span>
          </label>
        </div>
      </div>

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
