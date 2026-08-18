import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery | Myra Shopping Mall",
  description: "Learn about shipping times, complimentary delivery options, and tracking updates for your orders.",
};

export default function ShippingPage() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-24 prose prose-sm prose-slate">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#4A3B2C] mb-8 tracking-wide">Shipping & Delivery</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mb-10">Last Updated: August 8, 2026</p>
        
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Complimentary Standard Shipping</h2>
            <p>
              We are proud to offer complimentary standard delivery on all storefront orders. No minimum purchase quantity or code is required to receive free delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Processing Times</h2>
            <p>
              Orders are processed and dispatched within 1–2 business days. Orders placed over weekends or official holidays will begin processing on the following business day.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Delivery Estimates</h2>
            <p>
              Standard shipping takes approximately 3–5 business days within major metro areas, and up to 7 business days for regional locations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Order Tracking</h2>
            <p>
              Once your order has shipped, you will receive a tracking link via email to monitor the status and estimated arrival date of your parcel. You can also view live fulfillment status directly from your account page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
