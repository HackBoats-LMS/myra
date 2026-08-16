"use client";
import { useState } from "react";
import { retryRazorpayPayment, confirmRazorpayPayment } from "@/actions/payment";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
};

interface RazorpayWindow {
  Razorpay?: RazorpayConstructor;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || (window as RazorpayWindow).Razorpay) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-myra-razorpay]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.dataset.myraRazorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

export default function PayNowButton({ orderId, amount }: { orderId: string; amount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const payment = await retryRazorpayPayment(orderId);
      await loadRazorpayScript();
      const Rzr = (window as RazorpayWindow).Razorpay;
      if (!Rzr) {
        setIsProcessing(false);
        toast.error("Payment gateway failed to load. Please try again.");
        return;
      }
      const rzp = new Rzr({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Myra",
        description: `Order #${payment.orderId.substring(0, 8)}`,
        order_id: payment.razorpayOrderId,
        prefill: { name: undefined, email: undefined },
        theme: { color: "#B6925B" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const { orderId: confirmedOrderId } = await confirmRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            router.push(`/order-confirmation/${confirmedOrderId}`);
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
    } catch (error) {
      setIsProcessing(false);
      toast.error(error instanceof Error ? error.message : "Payment could not be initiated.");
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={isProcessing}
      className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-50 rounded-none"
    >
      {isProcessing ? (
        <i className="ri-loader-4-line animate-spin text-lg" />
      ) : (
        <i className="ri-bank-card-line text-lg" />
      )}
      Pay ₹{amount.toLocaleString("en-IN")} Now
    </button>
  );
}
