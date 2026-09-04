import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Myra Shopping Mall",
  description: "Read the terms, rules, and guidelines governing the use of the Myra Shopping Mall storefront.",
};

export default function TermsPage() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-24 prose prose-sm prose-slate">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2D1F2F] mb-8 tracking-wide">Terms of Service</h1>
        <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mb-10">Last Updated: August 8, 2026</p>
        
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-[#2D1F2F] mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Myra Shopping Mall website, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#2D1F2F] mb-3">2. Account Management</h2>
            <p>
              When creating an account, you are responsible for maintaining the confidentiality of your password and restricting access to your computer or mobile device. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#2D1F2F] mb-3">3. Pricing and Availability</h2>
            <p>
              All prices are subject to change without notice. We reserve the right to modify or discontinue any product or collection without liability. While we aim for accuracy, inventory errors may occasionally occur, and we reserve the right to cancel affected orders.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#2D1F2F] mb-3">4. Limitation of Liability</h2>
            <p>
              Myra Shopping Mall shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our website or services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
