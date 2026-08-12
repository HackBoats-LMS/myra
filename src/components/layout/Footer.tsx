import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#B6925B] text-white py-12 px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        {/* Left: Branding & Contact */}
        <div className="space-y-6 max-w-xs">
          <Link href="/">
            <Image
              src="/displaypics/malllogo.png"
              alt="Myra Shopping Mall Logo"
              width={150}
              height={50}
              className="object-contain h-12 w-auto brightness-0 invert"
            />
          </Link>
          <div className="space-y-2 text-sm text-white/90">
            <p className="flex items-start gap-2">
              <span className="mt-1">📍</span>
              <span>123 Elite Avenue, Landmark Plaza,<br />Town Center, Metro City 400001</span>
            </p>
            <p className="flex items-center gap-2">
              <span>📞</span>
              <span>+91 98765 43210</span>
            </p>
            <p className="flex items-center gap-2">
              <span>✉️</span>
              <span>support@myrashoppingmall.com</span>
            </p>
          </div>
          <div className="flex gap-4 pt-2 text-xl">
            {/* Social Icons Placeholder */}
            <span className="cursor-pointer hover:text-white/80">📸</span>
            <span className="cursor-pointer hover:text-white/80">🐦</span>
            <span className="cursor-pointer hover:text-white/80">📘</span>
          </div>
        </div>

        {/* Center: Mission / Quote */}
        <div className="max-w-md space-y-4 md:mt-8">
          <p className="text-sm font-serif leading-relaxed text-center md:text-left text-white/90">
            &ldquo;Myra Shopping Mall represents the pinnacle of premium ethnic and contemporary fashion. We curate exquisite collections to ensure you shine at every celebration.&rdquo;
          </p>
        </div>

        {/* Right: Quick Links */}
        <div className="space-y-6">
          <h3 className="font-serif text-lg tracking-wide">Quick Links</h3>
          <ul className="space-y-3 text-sm text-white/90">
            <li><Link href="/collections" className="hover:underline underline-offset-4">Collections</Link></li>
            <li><Link href="/collections/sarees" className="hover:underline underline-offset-4">Sarees</Link></li>
            <li><Link href="/collections/bridal" className="hover:underline underline-offset-4">Bridal Wear</Link></li>
            <li><Link href="/about" className="hover:underline underline-offset-4">Our Story</Link></li>
            <li><Link href="/faq" className="hover:underline underline-offset-4">FAQs</Link></li>
            <li><Link href="/contact" className="hover:underline underline-offset-4">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/20 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} Myra Shopping Mall. All Rights Reserved.
      </div>
    </footer>
  );
}
