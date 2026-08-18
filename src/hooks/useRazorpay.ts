"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmRazorpayPayment } from "@/actions/payment";
import { useToast } from "@/components/ui/Toast";

type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void };
interface RazorpayWindow {
  Razorpay?: RazorpayConstructor;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof (window as RazorpayWindow).Razorpay !== "undefined") return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
}

interface OpenRazorpayOptions {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  orderId: string;
  prefill: { name?: string; email?: string; contact?: string };
}

/**
 * Wraps the Razorpay modal + server-side confirmation. On success it redirects
 * to the order-confirmation page. Emits processing state so callers can disable
 * the Place Order button while the modal is open.
 */
export function useRazorpay() {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const open = async (options: OpenRazorpayOptions) => {
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
        name: options.prefill.name ?? undefined,
        email: options.prefill.email ?? undefined,
        contact: options.prefill.contact ?? undefined,
      },
      theme: { color: "#B6925B" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
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

  return { openRazorpay: open, isProcessing, setProcessing: setIsProcessing };
}