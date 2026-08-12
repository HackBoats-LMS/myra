import HeroGrid from "@/components/storefront/HeroGrid";
import CategoryShowcase from "@/components/storefront/CategoryShowcase";
import ProductCard from "@/components/storefront/ProductCard";
import { getAllCollections, getFeaturedProducts, getBestSellers } from "@/services/products";
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
  let collections: Awaited<ReturnType<typeof getAllCollections>> = [];
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let bestSellers: Awaited<ReturnType<typeof getBestSellers>> = [];

  try {
    const results = await Promise.all([
      getAllCollections(),
      getFeaturedProducts(4),
      getBestSellers(4),
    ]);
    collections = results[0];
    featuredProducts = results[1];
    bestSellers = results[2];
  } catch (error) {
    console.warn("Database unreachable in StorefrontHome, falling back to empty state:", error);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = { /* ... omitted for brevity in code snippet, but keeping same as before */
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Myra Shopping Mall",
    url: appUrl,
    logo: `${appUrl}/logo.png`,
    sameAs: ["https://www.facebook.com/myrashoppingmall"]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="w-full bg-[#FAFAFA]">
        
        {/* 1. Hero Section */}
        <HeroGrid />

        {/* 2. Category Pills */}
        <CategoryShowcase collections={collections.slice(0, 4)} />

        {/* 3. Best Sellers */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <SectionHeading title="Best Sellers" />
          <div className="flex items-center justify-between">
            <button className="hidden md:flex p-2 text-gray-400 hover:text-[#B6925B] transition-colors"><span className="text-2xl">&lsaquo;</span></button>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1 px-0 md:px-4">
              {bestSellers.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            <button className="hidden md:flex p-2 text-gray-400 hover:text-[#B6925B] transition-colors"><span className="text-2xl">&rsaquo;</span></button>
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/collections" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-colors">
              View All
            </Link>
          </div>
        </section>

        {/* 4. Marquee/Ticker */}
        <div className="w-full bg-[#C6A664] py-3 overflow-hidden flex items-center">
          <div className="whitespace-nowrap flex gap-12 text-white font-serif text-sm tracking-widest uppercase animate-marquee">
            <span>✧ Premium Quality</span>
            <span>✧ Assured Fit & Fine</span>
            <span>✧ Handpicked Styles</span>
            <span>✧ Unmatched Offer</span>
            <span>✧ Secure Checkout</span>
            <span>✧ Premium Quality</span>
            <span>✧ Assured Fit & Fine</span>
            <span>✧ Handpicked Styles</span>
          </div>
        </div>

        {/* 5. Bridal Elegance Banner */}
        <section className="w-full relative h-[400px] md:h-[600px]">
          <Image src="/displaypics/bridal-banner.png" alt="Bridal Collection" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-end pr-8 md:pr-32">
            <div className="max-w-md text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-serif text-[#FDFBF7] tracking-wider leading-tight">
                BRIDAL ELEGANCE.<br />TIMELESS HERITAGE.<br />UNFORGETTABLE YOU.
              </h2>
              <p className="text-sm text-[#FDFBF7]/90 font-serif italic">
                Handcrafted Kanjeevaram Silks.<br />Made for Your Grand Beginning.
              </p>
              <Link href="/collections/bridal" className="inline-block bg-[#FDFBF7] text-[#4A3B2C] hover:bg-white px-8 py-3 rounded-none text-xs font-bold uppercase tracking-widest transition-colors shadow-lg">
                Shop Bridal Collection &rsaquo;
              </Link>
            </div>
          </div>
        </section>

        {/* 6. New Arrivals */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">
          <SectionHeading title="New Arrivals" />
          <div className="flex items-center justify-between">
            <button className="hidden md:flex p-2 text-gray-400 hover:text-[#B6925B] transition-colors"><span className="text-2xl">&lsaquo;</span></button>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1 px-0 md:px-4">
              {featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            <button className="hidden md:flex p-2 text-gray-400 hover:text-[#B6925B] transition-colors"><span className="text-2xl">&rsaquo;</span></button>
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/collections" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-colors">
              View All
            </Link>
          </div>
        </section>

        {/* 7. Curated Collection Block */}
        <section className="w-full bg-[#B6925B] py-20 px-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            <div className="relative w-full md:w-1/2 h-[300px] md:h-[400px]">
              <Image src="/displaypics/curated-sarees.png" alt="Curated Sarees" fill className="object-contain" />
            </div>
            <div className="text-center md:text-left space-y-4 max-w-sm text-white">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/80">Where Every Saree Becomes a Statement</h4>
              <h2 className="text-3xl md:text-4xl font-serif leading-tight">Curated for Every Celebration</h2>
              <p className="text-sm text-white/90 leading-relaxed italic font-serif">
                Hand-picked thoughtfully sourced collection of the highest quality pure silk sarees showcasing unique craftsmanship...
              </p>
            </div>
          </div>
        </section>

        {/* 8. Feature Icons Bar */}
        <section className="w-full bg-white py-12 border-b border-[#B6925B]/20">
          <div className="max-w-5xl mx-auto flex justify-between px-8">
            <div className="flex flex-col items-center gap-3"><span className="text-2xl text-[#B6925B]">🚚</span><span className="text-[10px] text-gray-500 uppercase tracking-widest text-center">Complimentary<br/>Shipping</span></div>
            <div className="flex flex-col items-center gap-3"><span className="text-2xl text-[#B6925B]">✨</span><span className="text-[10px] text-gray-500 uppercase tracking-widest text-center">Premium<br/>Quality</span></div>
            <div className="flex flex-col items-center gap-3"><span className="text-2xl text-[#B6925B]">🛡️</span><span className="text-[10px] text-gray-500 uppercase tracking-widest text-center">Secure<br/>Checkout</span></div>
            <div className="flex flex-col items-center gap-3"><span className="text-2xl text-[#B6925B]">📞</span><span className="text-[10px] text-gray-500 uppercase tracking-widest text-center">24/7<br/>Support</span></div>
          </div>
        </section>

        {/* 9. Store Location Block */}
        <section className="max-w-6xl mx-auto py-24 px-8 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          <div className="relative w-full md:w-1/3 h-[400px] rounded-sm overflow-hidden shadow-xl">
            <Image src="/displaypics/store-front.png" alt="Myra Physical Store" fill className="object-cover" />
          </div>
          <div className="max-w-md text-center space-y-6">
            <h2 className="text-3xl font-serif text-[#B6925B]">Visit Myra Shopping Mall</h2>
            <h4 className="text-sm font-bold text-[#4A3B2C] uppercase tracking-widest">Your Fashion Destination in Chennai</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Experience the luxury of our collections in person at our flagship store. Feel the fabrics, try on your favorite outfits, and let our expert stylists help you find the perfect look for any occasion.
            </p>
            <p className="text-xs text-[#B6925B] font-bold">📍 123 Elite Avenue, Landmark Plaza, Chennai</p>
            <Link href="/contact" className="inline-block bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 rounded-none text-xs font-bold uppercase tracking-widest transition-colors shadow-md mt-4">
              Get Directions
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}