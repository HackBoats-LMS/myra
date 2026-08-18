import type { Metadata } from "next";
import TrackOrderForm from "@/app/(storefront)/track/_components/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order | Myra Shopping Mall",
};

export default function TrackOrderPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <i className="ri-truck-line text-5xl text-[#B6925B] mx-auto block" />
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide mt-3">
          Track Your Order
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Enter your order ID and the email you used at checkout to see live status.
        </p>
      </div>
      <TrackOrderForm />
    </div>
  );
}