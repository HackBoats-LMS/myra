import Link from "next/link";
import Image from "next/image";

export default function StoreLocationSection() {
  return (
    <section className="max-w-[1200px] mx-auto py-12 md:py-24 px-4 md:px-8 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
      <div className="relative w-full md:w-2/5 h-[250px] md:h-[500px] overflow-hidden shadow-2xl">
        <Image src="/displaypics/myra.png" alt="Myra Physical Store" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
      </div>
      <div className="max-w-md text-center space-y-4 md:space-y-8">
        <h2 className="text-2xl md:text-4xl font-serif text-[#B6925B]">Visit Myra Shopping Mall</h2>
        <h4 className="text-[10px] md:text-xs font-bold text-[#4A3B2C] uppercase tracking-widest">Your Fashion Destination in Vellore</h4>
        <p className="text-[10px] md:text-sm text-gray-500 leading-relaxed italic font-serif">
          Experience the luxury of our collections in person at our flagship store. Feel the fabrics, try on your favorite outfits, and let our expert stylists help you find the perfect look for any occasion.
        </p>
        <p className="text-[10px] md:text-xs text-[#B6925B] font-bold tracking-wide"><i className="ri-map-pin-line mr-1 md:mr-2 text-sm md:text-lg align-middle" />No 12, Officers Line, Vellore, Tamil Nadu 632001</p>
        <Link href="/contact" className="inline-block bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 md:px-10 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors shadow-md mt-4 md:mt-6">
          Get Directions
        </Link>
      </div>
    </section>
  );
}
