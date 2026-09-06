import Link from "next/link";
import Image from "next/image";
import { getCachedMainCollections } from "@/lib/cache";

const FALLBACK_MAIN_COLLECTIONS = [
  { name: "Sarees", slug: "sarees" },
  { name: "Women", slug: "women" },
  { name: "Kids", slug: "kids" },
  { name: "Men", slug: "men" },
  { name: "Bridal", slug: "bridal" },
];

export default async function Footer() {
  let mainCollections = FALLBACK_MAIN_COLLECTIONS;
  try {
    const cached = await getCachedMainCollections();
    if (cached && cached.length > 0) {
      mainCollections = cached;
    }
  } catch (error) {
    console.warn("[Footer] Could not fetch cached main collections, using fallback:", error);
  }

  return (
    <footer className="w-full bg-[#5C0820] text-[#F7EFF0] font-sans mt-auto select-none">
      {/* Main Grid Container */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 lg:px-12 pt-12 md:pt-14 lg:pt-16 pb-10 md:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
          
          {/* Column 1: Shop Now (Main Collections) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-white text-base sm:text-lg font-medium tracking-wide">
              Shop Now
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-[13px] sm:text-sm text-[#E2D2D5]">
              {mainCollections.map((col) => (
                <li key={col.slug}>
                  <Link
                    href={`/collections/${col.slug}`}
                    className="hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    {col.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Useful Links (Store & Legal) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-white text-base sm:text-lg font-medium tracking-wide">
              Useful Links
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-[13px] sm:text-sm text-[#E2D2D5]">
              <li>
                <Link href="/about" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Blog &amp; Stories
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  FAQ&apos;s
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Terms of Uses
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Privacy &amp; Policies
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Measurements Forms
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Shipping and Return Policies
                </Link>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=Myra+Shopping+Mall+Guntur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Google Reviews</span>
                  <span className="text-[10px] text-amber-300 font-bold">★ 4.8</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Useful Links (Services & Care) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-white text-base sm:text-lg font-medium tracking-wide">
              Useful Links
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-[13px] sm:text-sm text-[#E2D2D5]">
              <li>
                <a
                  href="https://maps.google.com/?q=Myra+Shopping+Mall+Guntur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  Store Locator
                </a>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Cash on Delivery
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Free Shippings
                </Link>
              </li>
              <li>
                <Link href="/fabrics-care" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Fabrics Care
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Sitemap
                </Link>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=Myra+Shopping+Mall+Guntur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  Customer Reviews
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us, Address, Shipping & Payment Partners */}
          <div className="lg:col-span-3 space-y-5">
            <h3 className="text-white text-base sm:text-lg font-medium tracking-wide">
              Contact Us
            </h3>

            {/* Social Icons Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Facebook */}
              <a
                href="https://facebook.com/myrashoppingmall"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com/myrashoppingmall"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="w-8 h-8 rounded-full bg-[#14171A] text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/myrashoppingmall"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4 4 1.791 4 4 4 4 0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Pinterest */}
              <a
                href="https://pinterest.com/myrashoppingmall"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="w-8 h-8 rounded-full bg-[#BD081C] text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@myrashoppingmall"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/919492151481"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>

            {/* Address & Store Info */}
            <div className="text-[13px] sm:text-sm text-[#E2D2D5] space-y-1.5 leading-relaxed">
              <p className="text-white font-medium text-sm sm:text-base">
                Myra Shopping Mall
              </p>
              <p className="text-[#E2D2D5]">
                No. 5-155, G Plus 3 Floors,
              </p>
              <p className="text-[#E2D2D5]">
                4, Koritepadu Rd, Vinayak Nagar,
              </p>
              <p className="text-[#E2D2D5]">
                Guntur, Andhra Pradesh – 522007, India
              </p>
              
              <div className="pt-2 space-y-1">
                <p>
                  <a href="tel:+919492151481" className="hover:text-white transition-colors underline underline-offset-2">
                    +91 94921 51481 (STORE)
                  </a>
                </p>
                <p className="text-emerald-400 font-medium">
                  24X7 Live Chat / WhatsApp
                </p>
                <p>
                  <a href="mailto:official@myrashoppingmall.com" className="hover:text-white transition-colors underline underline-offset-2">
                    official@myrashoppingmall.com
                  </a>
                </p>
                <p className="text-xs text-[#C9B5B9]">
                  (Monday to Sunday 10AM to 9PM)
                </p>
              </div>
            </div>

            {/* Shipping Partner Section */}
            <div className="pt-2 space-y-2">
              <h4 className="text-white text-xs sm:text-sm font-medium tracking-wide">
                Shipping Partner
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Shiprocket Official Logo Badge */}
                <div className="bg-white rounded px-2.5 py-1 flex items-center justify-center shadow-sm h-7">
                  <Image
                    src="/icons/shiprocket.svg"
                    alt="Shiprocket"
                    width={105}
                    height={23}
                    className="h-4 w-auto object-contain"
                  />
                </div>
              </div>
            </div>

            {/* We Accept / Payment Methods Section */}
            <div className="pt-2 space-y-2">
              <h4 className="text-white text-xs sm:text-sm font-medium tracking-wide">
                We Accept
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Visa */}
                <div className="bg-white rounded px-2 py-1 flex items-center justify-center shadow-sm h-6">
                  <span className="font-sans font-extrabold italic text-[11px] text-[#1A1F71] tracking-tighter">
                    VISA
                  </span>
                </div>

                {/* Mastercard */}
                <div className="bg-white rounded px-2 py-1 flex items-center justify-center gap-0.5 shadow-sm h-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B] opacity-95" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] opacity-95 -ml-1.5" />
                </div>

                {/* RuPay */}
                <div className="bg-white rounded px-2 py-1 flex items-center justify-center shadow-sm h-6">
                  <span className="font-sans font-bold text-[10px] text-[#097939] tracking-tight">
                    Ru<span className="text-[#092F60]">Pay</span>
                  </span>
                </div>

                {/* UPI */}
                <div className="bg-white rounded px-2 py-1 flex items-center justify-center gap-1 shadow-sm h-6">
                  <svg className="w-2.5 h-2.5 text-[#006633]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                  <span className="font-sans font-black text-[10px] text-[#002D62] tracking-tighter">
                    UPI
                  </span>
                </div>

                {/* Cash on Delivery */}
                <div className="bg-white rounded px-2 py-1 flex items-center justify-center shadow-sm h-6">
                  <span className="font-sans font-bold text-[9px] uppercase tracking-wider text-gray-800">
                    COD
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="w-full border-t border-white/10 bg-[#470618] py-4 px-4 text-center">
        <p className="text-xs sm:text-[13px] text-[#E2D2D5] tracking-wider select-none">
          &copy; 2026 MYRA SHOPPING MALL. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
