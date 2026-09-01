import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#BA8B4E] text-white font-serif mt-auto">
      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-8 lg:px-16 pt-10 md:pt-12 lg:pt-14 pb-8 md:pb-10 lg:pb-12">
        {/* Responsive Grid for Mobile, iPad, and Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6 lg:gap-12 items-start">
          
          {/* Column 1: Brand Logo, Address, Phone, Email & Social Icons */}
          <div className="flex flex-col gap-4 md:gap-4 lg:gap-5 md:col-span-5 lg:col-span-5">
            {/* Logo in White */}
            <Link href="/" className="inline-block w-fit">
              <Image
                src="/displaypics/footerlogo.png"
                alt="Myra Shopping Mall"
                width={304}
                height={133}
                priority
                className="object-contain h-12 sm:h-14 md:h-14 lg:h-16 w-auto"
              />
            </Link>

            {/* Address */}
            <div className="flex items-start gap-2 text-white/95 text-xs sm:text-[13px] md:text-xs lg:text-sm leading-relaxed">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418-4.418-7-8.582-7-12a7 7 0 1114 0c0 3.418-2.582 7.582-7 12z" />
                <circle cx="12" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>5-155, G Plus 3 Floors, 4, Koritepadu Rd, Vinayak Nagar, Guntur, Andhra Pradesh 522007</span>
            </div>

            {/* Phone & Email */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row sm:items-center md:items-start lg:items-center gap-x-5 gap-y-2 text-xs sm:text-[13px] md:text-xs lg:text-sm">
              <a 
                href="tel:+919492151481" 
                className="flex items-center gap-1.5 text-white/95 underline underline-offset-2 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 94921 51481</span>
              </a>

              <a 
                href="mailto:official@myrashoppingmall.com" 
                className="flex items-center gap-1.5 text-white/95 underline underline-offset-2 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>official@myrashoppingmall.com</span>
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 text-white pt-1">
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4 4 1.791 4 4 4 4 0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:opacity-80 transition-opacity">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Facebook */}
              <a href="https://facebook.com/myrashoppingmall" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Location Map Pin */}
              <a 
                href="https://maps.google.com/?q=Myra+Shopping+Mall+Guntur" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Google Maps Location" 
                className="hover:opacity-80 transition-opacity"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Brand Story / Description */}
          <div className="text-white/95 text-xs sm:text-[13px] md:text-xs lg:text-[15px] leading-relaxed md:col-span-4 lg:col-span-4 md:pt-1 lg:pt-2">
            <p>
              Explore beautifully curated collections of sarees and contemporary women&apos;s fashion at Myra Shopping Mall. Conveniently located in Guntur, we welcome you to experience quality, elegance, and personalized shopping under one roof.
            </p>
          </div>

          {/* Column 3: Our Policies */}
          <div className="flex flex-col gap-2.5 sm:gap-3 md:col-span-3 lg:col-span-3 shrink-0">
            <h3 className="text-base sm:text-lg md:text-base lg:text-xl font-medium tracking-wide text-white whitespace-nowrap">
              Our Policies
            </h3>
            <ul className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-[13px] md:text-xs lg:text-sm text-white/95 whitespace-nowrap">
              <li>
                <Link href="/track" className="hover:underline underline-offset-2 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline underline-offset-2 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:underline underline-offset-2 transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:underline underline-offset-2 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:underline underline-offset-2 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline underline-offset-2 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Strip with separator line */}
      <div className="w-full border-t border-white/60 bg-[#A8793E] py-3.5 px-4 text-center">
        <p className="text-[11px] sm:text-xs md:text-[13px] text-white tracking-wider font-serif select-none">
          &copy; 2026 MYRA SHOPPING MALL. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

