import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TrackOrderForm from "@/app/(storefront)/track/_components/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order | Myra Shopping Mall",
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string; orderId?: string; awb?: string; email?: string }>;
}) {
  const params = await searchParams;
  const targetId = params?.orderId || params?.id || params?.awb;

  if (targetId && targetId.trim()) {
    const emailParam = params?.email ? `?email=${encodeURIComponent(params.email.trim())}` : "";
    redirect(`/track/${encodeURIComponent(targetId.trim())}${emailParam}`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <i className="ri-truck-line text-5xl text-[#7A0B2E] mx-auto block" />
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide mt-3">
          Track Your Order
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Enter your Order ID, reference number, or AWB tracking number to see live status.
        </p>
      </div>
      <TrackOrderForm />
    </div>
  );
}

