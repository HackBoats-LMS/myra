import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import ShippingConfigForm from "./ShippingConfigForm";

export const metadata: Metadata = {
  title: "Shipping Settings | Admin Portal",
};

export default async function AdminShippingPage() {
  const config = await prisma.shippingConfig.findUnique({ where: { id: "global" } });

  const initial = {
    flatRate: config?.flatRate ?? 49,
    freeShippingThreshold: config?.freeShippingThreshold ?? 999,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 rounded-none">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Shipping Settings</h2>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Configure delivery charges for your store</p>
      </div>

      <div className="bg-white border border-[#B6925B]/20 p-6 md:p-8 shadow-sm rounded-none">
        <ShippingConfigForm initial={initial} />
      </div>

      <div className="bg-[#FAFAFA] border border-[#B6925B]/20 p-6 rounded-none">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#4A3B2C] mb-3">Free Shipping Offers</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Create a coupon with the offer type <span className="font-bold text-[#B6925B]">Shipping</span> to give free (or
          discounted) shipping. Free-shipping coupons stack with product discount offers.
        </p>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
        >
          <i className="ri-ticket-2-line text-sm" />
          Create Shipping Offer
        </Link>
      </div>
    </div>
  );
}
