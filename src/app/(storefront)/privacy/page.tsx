import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy | Myra Shopping Mall",
  description:
    "Comprehensive Privacy Policy of Myra Shopping Mall detailing how we collect, use, protect, and handle your personal, transaction, and shipping data.",
};


export default function PrivacyPage() {
  return (
    <div className="w-full bg-[#F5EFE6] min-h-screen py-10 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header */}
        <div className="border-b border-[#7A0B2E]/20 pb-8 mb-10">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#7A0B2E]">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#2D1F2F] mt-2 mb-4 tracking-wide">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-sans">
            <span>Effective Date: September 2026</span>
            <span>&bull;</span>
            <span>Last Updated: September 6, 2026</span>
            <span>&bull;</span>
            <span className="text-[#7A0B2E] font-medium">Compliance: DPDP Act 2023 & IT Act 2000 (India)</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="space-y-10 text-gray-700 leading-relaxed text-sm md:text-[15px] font-sans">
          
          {/* Section 1: Overview */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              1. Overview & Commitment
            </h2>
            <p>
              Welcome to <strong>Myra Shopping Mall</strong> (&ldquo;Myra&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We operate our flagship retail store located at <strong>5-155, G Plus 3 Floors, 4, Koritepadu Rd, Vinayak Nagar, Guntur, Andhra Pradesh – 522007, India</strong>, as well as our official online shopping platform.
            </p>
            <p>
              We honor the trust you place in us when sharing your personal information. This Privacy Policy transparently details the precise categories of data we collect, why we collect it, how it is processed and safeguarded, and your legal rights under India&apos;s <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong>Information Technology Act, 2000</strong>, and applicable Consumer Protection (E-Commerce) Rules.
            </p>
            <p className="bg-[#FAF6F0] p-4 rounded border-l-4 border-[#7A0B2E] text-xs sm:text-sm text-gray-800">
              <strong>Our Core Privacy Promise:</strong> We do <em>not</em> sell, rent, or trade your personal information, phone numbers, or email addresses to third-party brokers, advertisers, or lead generators.
            </p>
          </section>

          {/* Section 2: Data We Collect */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              2. Precise Data We Collect
            </h2>
            <p>
              To deliver a seamless e-commerce experience, process your orders, arrange doorstep courier deliveries, and provide customer support, we collect the following types of information:
            </p>

            <div className="space-y-4 divide-y divide-gray-100">
              {/* Account Data */}
              <div className="pt-3 first:pt-0 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">A. Account & Contact Details</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li><strong>Full Name:</strong> To personalize your account and address your parcel shipments.</li>
                  <li><strong>Email Address:</strong> For account authentication, password recovery, order confirmations, and dispatch notifications.</li>
                  <li><strong>Mobile Phone Numbers:</strong> Your primary phone number and optional secondary contact number to ensure courier delivery personnel can reach you for doorstep handover, delivery OTP verification, and dispatch SMS/WhatsApp alerts.</li>
                  <li><strong>Credentials:</strong> Account passwords, which are cryptographically hashed and salted using one-way cryptographic algorithms. We never store or have access to raw plaintext passwords.</li>
                </ul>
              </div>

              {/* Delivery Address */}
              <div className="pt-4 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">B. Shipping, Delivery & Gifting Addresses</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li><strong>Physical Addresses:</strong> Street address, flat/floor/house number, landmark, locality, city, state, postal PIN code, and country.</li>
                  <li><strong>Address Labels:</strong> User-designated categories such as &ldquo;Home&rdquo; or &ldquo;Office&rdquo;.</li>
                  <li><strong>Gifting Information:</strong> If you choose to send an order as a gift, we collect the recipient&apos;s name, delivery address, contact phone number, and any personalized gift message you provide.</li>
                </ul>
              </div>

              {/* Orders & Purchases */}
              <div className="pt-4 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">C. Orders, Measurements & Purchase History</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li>Items purchased, product codes (SKUs), selected variants (sizes, blouse stitch specifications, custom saree fall/pico requirements, colors, and fabric types).</li>
                  <li>Order date, time, total bill amount, applied promotional discount codes, and tax/GST itemization for statutory tax invoicing.</li>
                  <li>Wishlist collections and active cart contents saved across sessions.</li>
                </ul>
              </div>

              {/* Payment Info */}
              <div className="pt-4 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">D. Payment & Billing Information</h3>
                <p className="text-gray-600">
                  We integrate with <strong>Razorpay</strong>, an authorized Reserve Bank of India (RBI) payment aggregator and PCI-DSS Level 1 certified payment gateway, to process online payments securely:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li><strong>Online Transactions:</strong> When paying via UPI, Credit/Debit Cards, Net Banking, or Digital Wallets, your financial information is transmitted directly to Razorpay over end-to-end TLS encryption. <strong>Myra Shopping Mall does NOT store your credit/debit card numbers, CVV, expiry dates, or banking PINs on its servers.</strong></li>
                  <li><strong>Gateway Tokens:</strong> We only store the transaction reference ID, Razorpay Order ID, Razorpay Payment ID, and payment status (e.g., PAID, UNPAID, REFUNDED) to verify payment settlement.</li>
                  <li><strong>Cash on Delivery (COD) & Refunds:</strong> If you place a COD order and later request a refund on an eligible returned item, you may voluntarily provide your bank account details (Account Number, Account Holder Name, and IFSC code) so we can process direct bank disbursement. These details are used solely to complete the requested refund.</li>
                </ul>
              </div>

              {/* Logistics & Tracking */}
              <div className="pt-4 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">E. Logistics & Courier Tracking Data</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li>Airway Bill Number (AWB), Shiprocket order and shipment identifiers, courier partner assigned (e.g., Blue Dart, DTDC, FedEx, Delhivery).</li>
                  <li>Shipment status timestamps: order packed, dispatched, out for delivery, and confirmed delivered.</li>
                </ul>
              </div>

              {/* Browsing & Device */}
              <div className="pt-4 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">F. Device, Technical & Cookie Data</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li>Internet Protocol (IP) address, approximate geographic location, browser user-agent, operating system, and screen resolution.</li>
                  <li><strong>Session Cookies:</strong> Essential secure HTTP-only cookies to keep you signed in, prevent Cross-Site Request Forgery (CSRF), and maintain items in your bag.</li>
                  <li><strong>Web Push Notifications:</strong> If you explicitly opt-in to browser notifications, we store a cryptographic endpoint and authentication token to send you restock alerts and delivery notifications. You can revoke this permission at any time in your browser settings.</li>
                </ul>
              </div>

              {/* Customer Support & Reviews */}
              <div className="pt-4 space-y-2">
                <h3 className="font-serif font-bold text-[#2D1F2F] text-base">G. Communications, Reviews & Return Requests</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
                  <li>Messages sent via our Contact Us form, email correspondence sent to <code>official@myrashoppingmall.com</code>, and WhatsApp chat inquiries.</li>
                  <li>Customer product ratings, written reviews, and customer-uploaded photos stored in secure cloud media storage.</li>
                  <li>Return and exchange requests, including selected reasons, descriptions, and uploaded proof images.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Data */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              3. Purpose & Legal Basis of Processing
            </h2>
            <p>We process your personal information strictly for legitimate commercial and operational purposes:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#FBF9F7] rounded border border-gray-100 space-y-1.5">
                <h4 className="font-bold text-[#2D1F2F] text-sm">Order Fulfillment & Delivery</h4>
                <p className="text-xs text-gray-600">Processing payments, picking and tailoring items, generating GST invoices, packaging, and dispatching via courier partners.</p>
              </div>
              <div className="p-4 bg-[#FBF9F7] rounded border border-gray-100 space-y-1.5">
                <h4 className="font-bold text-[#2D1F2F] text-sm">Real-time Updates & Tracking</h4>
                <p className="text-xs text-gray-600">Sending SMS, WhatsApp, and email notifications regarding order confirmation, courier AWB tracking, and out-for-delivery status.</p>
              </div>
              <div className="p-4 bg-[#FBF9F7] rounded border border-gray-100 space-y-1.5">
                <h4 className="font-bold text-[#2D1F2F] text-sm">Customer Care & Consultations</h4>
                <p className="text-xs text-gray-600">Assisting you with sizing, blouse measurements, saree fabric inquiries, video shopping appointments, returns, and refunds.</p>
              </div>
              <div className="p-4 bg-[#FBF9F7] rounded border border-gray-100 space-y-1.5">
                <h4 className="font-bold text-[#2D1F2F] text-sm">Security & Fraud Prevention</h4>
                <p className="text-xs text-gray-600">Preventing fraudulent orders, unauthorized account access, payment abuse, and ensuring platform integrity.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Third-Party Service Providers */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              4. Trusted Third-Party Service Providers
            </h2>
            <p>
              To provide top-tier services, we share only the minimal necessary data with vetted partners under strict data-protection agreements:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 pl-2">
              <li><strong>Logistics & Courier Aggregators:</strong> We share recipient name, delivery address, phone number, and invoice value with <em>Shiprocket</em> and courier networks (<em>Blue Dart, DTDC, FedEx, Delhivery</em>) solely to deliver your orders.</li>
              <li><strong>Payment Aggregators:</strong> <em>Razorpay</em> processes payments. They process card, UPI, and banking data under PCI-DSS Level 1 compliance.</li>
              <li><strong>Transactional Email Services:</strong> We use <em>Resend</em> to dispatch order confirmation invoices, shipping tracking emails, and password recovery emails.</li>
              <li><strong>Cloud Hosting & Database Infrastructure:</strong> Our database and media storage are hosted on enterprise cloud infrastructure with Row-Level Security (RLS) and end-to-end encryption.</li>
              <li><strong>Store Locator & Reviews:</strong> Google Places / Google Maps API to provide store directions to our Guntur mall and display verified reviews.</li>
            </ul>
          </section>

          {/* Section 5: Data Security */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              5. Data Security & Row-Level Protection
            </h2>
            <p>
              We implement comprehensive technical and organizational safeguards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 pl-2">
              <li><strong>Encryption in Transit:</strong> All communications between your browser and our servers are encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).</li>
              <li><strong>Database Row-Level Security (RLS):</strong> User accounts, addresses, and order histories are segmented so that only you and authorized store managers can access your data.</li>
              <li><strong>Role-Based Access Controls:</strong> Internal store staff access is restricted strictly on a need-to-know basis (e.g., shipping staff can only view shipping addresses and packing slips).</li>
            </ul>
          </section>

          {/* Section 6: Your Legal Rights */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              6. Your Legal Rights (DPDP Act 2023)
            </h2>
            <p>Under Indian data protection laws, you possess the following rights regarding your personal data:</p>
            <div className="space-y-2 text-gray-600 pl-2">
              <p><strong>&bull; Right to Access:</strong> You can view all your saved addresses, profile details, and past order records directly in your <Link href="/account" className="text-[#7A0B2E] underline underline-offset-2">Account Dashboard</Link>.</p>
              <p><strong>&bull; Right to Correction:</strong> You can update inaccurate profile information, phone numbers, or delivery addresses at any time.</p>
              <p><strong>&bull; Right to Erasure / Deletion:</strong> You can request the permanent deletion of your account and personal data by emailing our privacy team, subject to statutory retention requirements (such as retaining tax invoices for 7 years under Indian GST laws).</p>
              <p><strong>&bull; Right to Withdraw Consent:</strong> You may unsubscribe from marketing notifications or turn off push notifications directly from your browser settings.</p>
            </div>
          </section>

          {/* Section 7: Cookies */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/10 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              7. Cookies & Tracking Technologies
            </h2>
            <p>
              We utilize essential cookies to enable fundamental website features:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely while navigating between pages.</li>
              <li><strong>Cart Cookies:</strong> Remember your selected sarees, suits, and accessories while browsing.</li>
              <li><strong>Security Cookies:</strong> Protect against automated bots and cross-site scripting attacks.</li>
            </ul>
            <p className="text-xs text-gray-500">
              You can instruct your browser to refuse all cookies. However, disabling cookies will prevent you from staying logged in or completing checkout.
            </p>
          </section>

          {/* Section 8: Grievance Officer & Contact */}
          <section className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/20 space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] flex items-center gap-2">
              <span className="w-2 h-6 bg-[#7A0B2E] inline-block rounded-sm"></span>
              8. Grievance Officer & Contact Information
            </h2>
            <p>
              In accordance with the <strong>Information Technology Act, 2000</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the contact details of the Grievance Officer for Myra Shopping Mall are provided below:
            </p>

            <div className="bg-[#FAF6F0] p-5 sm:p-6 rounded-lg border border-[#7A0B2E]/15 text-sm space-y-2">
              <p className="font-bold text-[#2D1F2F]">Grievance Redressal Officer</p>
              <p className="text-gray-700"><strong>Establishment:</strong> Myra Shopping Mall</p>
              <p className="text-gray-700">
                <strong>Physical Address:</strong> 5-155, G Plus 3 Floors, 4, Koritepadu Rd, Vinayak Nagar, Guntur, Andhra Pradesh – 522007, India
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong>{" "}
                <a href="mailto:official@myrashoppingmall.com" className="text-[#7A0B2E] underline font-medium">
                  official@myrashoppingmall.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Store Customer Helpline:</strong>{" "}
                <a href="tel:+919177751481" className="text-[#7A0B2E] underline font-medium">
                  +91 91777 51481
                </a>
              </p>
              <p className="text-gray-700">
                <strong>Working Hours:</strong> Monday to Sunday, 10:00 AM – 9:00 PM IST
              </p>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Any privacy grievances or requests will be acknowledged within 48 hours and redressed within 30 days of receipt, in accordance with applicable Indian regulations.
            </p>
          </section>

        </div>

        {/* Back to Home / Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A0B2E] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#5C0820] transition-colors"
          >
            &larr; Back to Storefront
          </Link>
        </div>

      </div>
    </div>
  );
}
