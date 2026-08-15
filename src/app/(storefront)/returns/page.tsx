import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return Policy | Myra Shopping Mall",
  description: "Read details about our complimentary 30-day return policy and instructions on how to return items.",
};

export default function ReturnsPage() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-24 prose prose-sm prose-slate">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#4A3B2C] mb-8 tracking-wide">Return Policy</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mb-10">Last Updated: August 8, 2026</p>
        
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Complimentary 30-Day Returns</h2>
            <p>
              We want you to be completely satisfied with your purchase. Myra Shopping Mall offers complimentary returns on all eligible products within 30 days of shipment receipt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Return Eligibility</h2>
            <p>
              To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging. Clothing and accessory items must have all tags attached. Items marked as final sale cannot be returned.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">How to Start a Return</h2>
            <p>
              To initiate a return, please contact our customer support team with your Order ID. Once approved, we will send you a pre-paid shipping label to print and attach to your package.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">Refund Processing</h2>
            <p>
              Once your returned package is received and inspected at our warehouse, we will notify you of the approval or rejection of your refund. Approved refunds will be processed back to your original payment method within 5–7 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
