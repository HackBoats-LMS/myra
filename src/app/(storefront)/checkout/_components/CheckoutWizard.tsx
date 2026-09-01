"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutCart } from "@/actions/cart";
import { getUserAddresses } from "@/actions/address";
import { initiateRazorpayPayment } from "@/actions/payment";
import { normalizeIndianPhone } from "@/lib/phone";
import { useToast } from "@/components/ui/Toast";
import { useRazorpay } from "@/hooks/useRazorpay";
import DeliveryStep from "./DeliveryStep";
import PaymentStep from "./PaymentStep";
import ReviewStep from "./ReviewStep";
import OrderSummarySidebar from "./OrderSummarySidebar";
import type {
  CheckoutAddress,
  CheckoutGift,
  CheckoutOrderLine,
  CheckoutPricing,
  CheckoutShipping,
} from "./checkout-types";

interface CheckoutWizardProps {
  addresses: CheckoutAddress[];
  phones: string[];
  shipping: CheckoutShipping;
  taxPercent: number;
  autoAppliedCoupon?: string | null;
  autoDiscountAmount?: number;
  lines: CheckoutOrderLine[];
}

const STEPS = ["Delivery", "Payment", "Review"] as const;
const EMPTY_GIFT: CheckoutGift = {
  name: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export default function CheckoutWizard({
  addresses,
  phones,
  shipping,
  taxPercent,
  autoAppliedCoupon,
  autoDiscountAmount,
  lines,
}: CheckoutWizardProps) {
  const toast = useToast();
  const router = useRouter();
  const { openRazorpay, isProcessing, setProcessing } = useRazorpay();

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""
  );
  const [addressList, setAddressList] = useState<CheckoutAddress[]>(addresses);
  const [selectedPhone, setSelectedPhone] = useState<string>(() => {
    try {
      const saved = normalizeIndianPhone(localStorage.getItem("myra_delivery_phone"));
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    return (
      normalizeIndianPhone(phones[0]) ||
      normalizeIndianPhone(addresses.find((a) => a.isDefault)?.phone) ||
      normalizeIndianPhone(addresses[0]?.phone) ||
      ""
    );
  });
  const [isGift, setIsGift] = useState(false);
  const [gift, setGift] = useState<CheckoutGift>(EMPTY_GIFT);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(autoAppliedCoupon || null);
  const [appliedCouponType, setAppliedCouponType] = useState<string | null>(autoAppliedCoupon ? "STANDARD" : null);
  const [appliedCouponValue, setAppliedCouponValue] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(autoDiscountAmount || 0);
  // Tracks whether the user removed an auto-applied coupon so the server does
  // not silently re-apply it on submit.
  const [couponRemoved, setCouponRemoved] = useState(false);

  // Pricing mirrors the server's calculateOrderTotal so displayed totals match
  // exactly what will be charged.
  const pricing: CheckoutPricing = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const baseShipping = subtotal >= shipping.freeShippingThreshold ? 0 : shipping.flatRate;
    const shippingAmount =
      appliedCouponType === "SHIPPING"
        ? Math.max(0, baseShipping - Math.min(appliedCouponValue, baseShipping))
        : baseShipping;
    const discount = Math.min(discountAmount, subtotal);
    const taxBase = Math.max(subtotal - discount, 0) + shippingAmount;
    const taxAmount = taxPercent > 0 ? Math.round((taxBase * (taxPercent / 100)) * 100) / 100 : 0;
    const finalTotal = Math.max(taxBase + taxAmount, 0);
    const round2 = (n: number) => Math.round(n * 100) / 100;
    return {
      subtotal: round2(subtotal),
      discountAmount: round2(discount),
      shippingAmount: round2(shippingAmount),
      taxAmount: round2(taxAmount),
      finalTotal: round2(finalTotal),
    };
  }, [lines, shipping, appliedCouponType, appliedCouponValue, discountAmount, taxPercent]);

// Re-read saved addresses after an inline add so the new one appears. If the
// currently selected address no longer exists (or none was selected), pick the
// default/first address so a freshly added default address is auto-selected.
const refreshAddresses = async () => {
    try {
      const list = await getUserAddresses();
      const addrList = list as CheckoutAddress[];
      setAddressList(addrList);
      setSelectedAddressId((current) => {
        if (current && addrList.some((a) => a.id === current)) return current;
        const next = addrList.find((a) => a.isDefault)?.id || addrList[0]?.id || "";
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const handleApplyCoupon = async (code: string, type: string, value: number, discount: number) => {
    setAppliedCoupon(code);
    setAppliedCouponType(type);
    setAppliedCouponValue(value);
    setDiscountAmount(discount);
    setCouponRemoved(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponType(null);
    setAppliedCouponValue(0);
    setDiscountAmount(0);
    setCouponRemoved(true);
    try {
      localStorage.removeItem("myra_coupon");
    } catch {
      /* ignore */
    }
  };

  const selectedAddress = addressList.find((a) => a.id === selectedAddressId) || null;

  // Step 1 validation.
  const deliveryValid = (() => {
    if (isGift) {
      return (
        gift.name.trim() &&
        /^\d{10}$/.test(gift.phone.trim()) &&
        gift.addressLine1.trim() &&
        gift.city.trim() &&
        gift.state.trim() &&
        gift.postalCode.trim() &&
        gift.country.trim()
      );
    }
    return !!selectedAddress && /^\d{10}$/.test(selectedPhone);
  })();

  const goNext = () => {
    if (step === 0) {
      if (!deliveryValid) {
        toast.error(
          isGift
            ? "Please complete the recipient details and a valid 10-digit phone."
            : "Please select a delivery address and provide a valid 10-digit contact number."
        );
        return;
      }
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (isProcessing) return;
    setProcessing(true);

    const deliveryPhone = isGift ? undefined : selectedPhone.trim() || undefined;
    const giftPayload = isGift
      ? {
          name: gift.name.trim(),
          phone: gift.phone.trim(),
          addressLine1: gift.addressLine1.trim(),
          city: gift.city.trim(),
          state: gift.state.trim(),
          postalCode: gift.postalCode.trim(),
          country: gift.country.trim(),
        }
      : undefined;

    try {
      if (paymentMethod === "RAZORPAY") {
        const payment = await initiateRazorpayPayment({
          addressId: isGift ? "" : selectedAddressId,
          couponCode: appliedCoupon || undefined,
          phone: deliveryPhone,
          gift: giftPayload,
          allowAutoApply: !couponRemoved,
        });
        await openRazorpay({
          keyId: payment.keyId,
          amount: payment.amount,
          currency: payment.currency,
          razorpayOrderId: payment.razorpayOrderId,
          orderId: payment.orderId,
          prefill: {
            name: isGift ? gift.name : undefined,
            contact: isGift ? gift.phone : deliveryPhone || undefined,
          },
          addressId: isGift ? "" : selectedAddressId,
          couponCode: appliedCoupon || undefined,
          phone: deliveryPhone,
          gift: giftPayload,
          allowAutoApply: !couponRemoved,
        });
      } else {
        const result = await checkoutCart(
          isGift ? "" : selectedAddressId,
          appliedCoupon || undefined,
          deliveryPhone,
          giftPayload,
          !couponRemoved
        );
        toast.success("Order placed successfully!");
        router.push(`/order-confirmation/${result.orderId}`);
      }
    } catch (error) {
      setProcessing(false);
      toast.error(error instanceof Error ? error.message : "Failed to place your order. Please try again.");
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-3 mb-8">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest border ${
                  done
                    ? "bg-[#4A3B2C] text-white border-[#4A3B2C]"
                    : active
                      ? "bg-[#B6925B] text-white border-[#B6925B]"
                      : "border-[#B6925B]/40 text-[#B6925B] bg-white"
                }`}
              >
                {done ? <i className="ri-check-line text-sm" /> : i + 1}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-[#4A3B2C]" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-[#B6925B]/30" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <div className="lg:col-span-7">
        {stepIndicator}

        {step === 0 && (
          <DeliveryStep
            addresses={addressList}
            phones={phones}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            selectedPhone={selectedPhone}
            setSelectedPhone={setSelectedPhone}
            isGift={isGift}
            setIsGift={setIsGift}
            gift={gift}
            setGift={setGift}
            onAddressListChange={refreshAddresses}
          />
        )}
        {step === 1 && <PaymentStep paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />}
        {step === 2 && (
          <ReviewStep
            lines={lines}
            address={selectedAddress}
            isGift={isGift}
            gift={gift}
            deliveryPhone={selectedPhone}
            paymentMethod={paymentMethod}
            pricing={pricing}
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
          />
        )}

        {step < 2 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="px-6 py-3 border border-[#B6925B]/30 text-[#4A3B2C] hover:bg-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="px-8 py-3 bg-[#B6925B] hover:bg-[#9c7d4e] text-white text-xs font-bold uppercase tracking-widest transition-colors rounded-none"
            >
              {step === 0 ? "Continue to Payment" : "Review Order"}
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-5">
        <OrderSummarySidebar
          pricing={pricing}
          shipping={shipping}
          appliedCoupon={appliedCoupon}
          appliedCouponType={appliedCouponType}
          shippingAmount={pricing.shippingAmount}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      </div>
    </div>
  );
}
