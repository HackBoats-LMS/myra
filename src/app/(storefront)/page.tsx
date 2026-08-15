import HeroGrid from "@/components/storefront/HeroGrid";
import CategoryButtons from "@/components/storefront/CategoryButtons";
import ProductCarousel from "@/components/storefront/ProductCarousel";
import { getFeaturedProducts, getBestSellers } from "@/services/products";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 3600; // 1 hour ISR

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
      <div className="h-[1px] w-16 md:w-32 bg-[#B6925B]/50"></div>
      <h2 className="text-2xl md:text-4xl font-serif text-[#B6925B] tracking-wider">{title}</h2>
      <div className="h-[1px] w-16 md:w-32 bg-[#B6925B]/50"></div>
    </div>
  );
}

export default async function StorefrontHome() {
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let bestSellers: Awaited<ReturnType<typeof getBestSellers>> = [];

  try {
    const results = await Promise.all([
      getFeaturedProducts(4),
      getBestSellers(4),
    ]);
    featuredProducts = results[0];
    bestSellers = results[1];
  } catch (error) {
    console.warn("Database unreachable in StorefrontHome, falling back to empty state:", error);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = { /* ... omitted for brevity in code snippet, but keeping same as before */
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Myra Shopping Mall",
    url: appUrl,
    logo: `${appUrl}/displaypics/malllogo.png`,
    sameAs: ["https://www.facebook.com/myrashoppingmall"]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="w-full bg-[#FAFAFA]">
        
        {/* 1. Hero Section */}
        <HeroGrid />

        {/* 2. Category Buttons */}
        <CategoryButtons />

        {/* 3. Best Sellers */}
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-16">
          <SectionHeading title="Best Sellers" />
          <ProductCarousel products={bestSellers} />
          <div className="flex justify-center mt-8 md:mt-12">
            <Link href="/collections" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
              View All
            </Link>
          </div>
        </section>

        {/* 4. Marquee/Ticker */}
        <div className="w-full bg-[#B6925B] py-3 overflow-hidden flex items-center border-y border-[#9c7d4e]">
          <div className="whitespace-nowrap flex gap-12 text-white font-serif text-[10px] md:text-xs tracking-widest uppercase animate-marquee opacity-90">
            <span>✧ Premium Fitting</span>
            <span>✧ Secure Shopping</span>
            <span>✧ Unmatched Offers</span>
            <span>✧ Easy Returns</span>
            <span>✧ Premium Quality</span>
            <span>✧ Secure Shopping</span>
            <span>✧ Exclusive Offers</span>
            <span>✧ Premium Fitting</span>
            <span>✧ Secure Shopping</span>
            <span>✧ Unmatched Offers</span>
          </div>
        </div>

        {/* 5. Bridal Elegance Banner */}
        <Link href="/collections/bridal" className="block w-full relative h-[180px] md:h-[600px] overflow-hidden cursor-pointer">
          <Image src="/displaypics/bribal poster.png" alt="Bridal Collection" fill quality={100} className="object-cover object-center" />
        </Link>

        {/* 6. New Arrivals */}
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-16">
          <SectionHeading title="New Arrivals" />
          <ProductCarousel products={featuredProducts} />
          <div className="flex justify-center mt-8 md:mt-12">
            <Link href="/collections" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
              View All
            </Link>
          </div>
        </section>


        {/* 7. Curated Collection Block */}
        <section className="w-full bg-[#9c7d4e] py-12 md:py-24 px-4 md:px-8">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24">
            <div className="relative w-full md:w-1/2 h-[200px] md:h-[450px]">
              <Image src="/displaypics/landingpage9.png" alt="Curated Sarees" fill quality={100} sizes="(max-width: 768px) 100vw, 50vw" className="object-contain drop-shadow-2xl" />
            </div>
            <div className="text-center md:text-left space-y-4 md:space-y-6 max-w-sm text-white">
              <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/80">Where Every Saree Becomes a Statement</h4>
              <h2 className="text-2xl md:text-5xl font-serif leading-tight">Curated for Every Celebration</h2>
              <p className="text-[10px] md:text-sm text-white/90 leading-relaxed italic font-serif opacity-90">
                Hand-picked thoughtfully sourced collection of the highest quality pure silk sarees showcasing unique craftsmanship. We bring together a diverse range of styles, from traditional classics to contemporary masterpieces, ensuring there&rsquo;s a perfect saree for every special moment.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Feature Icons Bar */}
        <section className="w-full bg-white py-8 md:py-16 border-b border-[#B6925B]/20">
          <div className="max-w-5xl mx-auto flex justify-between px-2 md:px-8">
            <div className="flex flex-col items-center gap-2 md:gap-4"><i className="ri-truck-line text-2xl md:text-3xl text-[#B6925B]" /><span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">Complimentary<br/>Shipping</span></div>
            <div className="flex flex-col items-center gap-2 md:gap-4"><i className="ri-star-line text-2xl md:text-3xl text-[#B6925B]" /><span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">Premium<br/>Quality</span></div>
            <div className="flex flex-col items-center gap-2 md:gap-4"><i className="ri-shield-check-line text-2xl md:text-3xl text-[#B6925B]" /><span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">Secure<br/>Checkout</span></div>
            <div className="flex flex-col items-center gap-2 md:gap-4"><i className="ri-customer-service-2-line text-2xl md:text-3xl text-[#B6925B]" /><span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">24/7<br/>Support</span></div>
          </div>
        </section>

        {/* 9. Store Location Block */}
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

      </div>
    </>
  );
}