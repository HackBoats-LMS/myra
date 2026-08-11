"use client";
import { useState } from "react";
import { checkoutCart } from "@/actions/cart";
import { useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";

export default function CheckoutButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    setIsProcessing(true);
    try {
      await checkoutCart();
      toast.success("Order placed successfully!");
      router.push("/account");
    } catch (error: any) {
      toast.error(error.message || "Failed to checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={isProcessing}
      className="w-full bg-[#0D3B66] hover:bg-[#082a4d] text-white px-8 py-4 rounded-none text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
    >
      {isProcessing ? (
        <ArrowPathIcon className="w-5 h-5 animate-spin" />
      ) : (
        isLoggedIn ? "Proceed to Checkout" : "Log in to Checkout"
      )}
    </button>
  );
}
