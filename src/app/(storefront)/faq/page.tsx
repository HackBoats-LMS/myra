import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Myra Shopping Mall",
  description: "Find quick answers to common queries regarding ordering, shipping, and returns.",
};

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "We offer complimentary shipping worldwide. Standard domestic delivery takes 3-5 business days, while international shipping takes 7-10 business days."
  },
  {
    q: "What is your return policy?",
    a: "We provide hassle-free returns within 30 days of purchase. Items must be unworn, tags attached, and in their original packaging. Return shipping labels are pre-paid."
  },
  {
    q: "Can I modify or cancel my order after placing it?",
    a: "You can request order cancellations directly from your Account Dashboard as long as the status is PENDING. Once shipped, orders cannot be changed but can be returned."
  },
  {
    q: "Are the products ethically made?",
    a: "Yes. All our products are ethically sourced and manufactured in certified facilities that pay fair wages and offer secure working conditions."
  },
  {
    q: "How do I trace my order?",
    a: "As soon as your package is dispatched, we send you a shipping confirmation email containing your tracking link. You can also view status updates in your Order History."
  }
];

export default function FAQPage() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-serif text-[#4A3B2C] tracking-wide">Frequently Asked Questions</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Quick support reference guide</p>
        </div>

        <div className="space-y-8 divide-y divide-[#B6925B]/20 pt-6">
          {FAQS.map((faq, index) => (
            <div key={index} className="pt-8 first:pt-0 space-y-3">
              <h3 className="text-lg font-bold text-[#4A3B2C] font-serif">{faq.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
