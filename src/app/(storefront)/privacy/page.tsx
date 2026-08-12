import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Myra Shopping Mall",
  description: "Learn about how Myra Shopping Mall collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 prose prose-sm prose-slate">
        <h1 className="text-3xl font-serif font-bold text-[#4A3B2C] mb-8 tracking-wide">Privacy Policy</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mb-10">Last Updated: August 8, 2026</p>
        
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">1. Information We Collect</h2>
            <p>
              We collect personal information you provide to us directly when registering, placing an order, subscribing to newsletters, or updating your profile. This includes your name, email address, phone number, and delivery addresses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">2. How We Use Your Information</h2>
            <p>
              Your information is used to process your orders, manage your online account, deliver purchased products, notify you of order updates, and improve your shopping experience at Myra Shopping Mall.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">3. Data Security and RLS</h2>
            <p>
              We employ modern industry security protocols. Data storage is powered by Supabase with Row Level Security (RLS) policies configured to ensure your data can only be accessed by you or authorized storefront administrators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#4A3B2C] mb-3">4. Cookies</h2>
            <p>
              We use functional session cookies to handle your login state and to manage temporary shopping carts for guest accounts. You may disable cookies in your browser settings, but it may impact cart persistence.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
