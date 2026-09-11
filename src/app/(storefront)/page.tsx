import OpeningAnimation from "@/features/home/components/OpeningAnimation";

import HeroGrid from "@/features/home/components/HeroGrid";
import CategoryButtons from "@/features/home/components/CategoryButtons";
import FlashSaleBanner from "@/features/flash-sale/components/FlashSaleBanner";
import RecommendedForYou from "@/features/home/components/RecommendedForYou";
import BestSellersSection from "@/features/home/components/BestSellersSection";
import MarqueeSection from "@/features/home/components/MarqueeSection";
import BridalBannerSection from "@/features/home/components/BridalBannerSection";
import NewArrivalsSection from "@/features/home/components/NewArrivalsSection";
import CuratedCollectionSection from "@/features/home/components/CuratedCollectionSection";
import FeatureIconsSection from "@/features/home/components/FeatureIconsSection";
import StoreLocationSection from "@/features/home/components/StoreLocationSection";

import { getFeaturedProducts, getBestSellers } from "@/services/products";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import { getCachedBanners, getCachedBrandStories } from "@/lib/cache";

import { preload } from 'react-dom';

export const revalidate = 3600; // 1 hour ISR

export default async function StorefrontHome() {
  preload('/animation/opening/design.png', { as: 'image' });
  preload('/animation/opening/design1.png', { as: 'image' });

  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let bestSellers: Awaited<ReturnType<typeof getBestSellers>> = [];
  let banners: Awaited<ReturnType<typeof getCachedBanners>> = [];
  let brandStories: Awaited<ReturnType<typeof getCachedBrandStories>> = [];
  let flashSales: Awaited<ReturnType<typeof getActiveFlashSales>> = [];

  try {
    // All home-page data fetched in one parallel batch — no child component fetches its own data.
    // This prevents duplicate getCachedBanners() / getActiveFlashSales() SSR calls.
    const results = await Promise.all([
      getFeaturedProducts(4),
      getBestSellers(4),
      getActiveFlashSales(),
      getCachedBanners().catch(() => [] as typeof banners),
      getCachedBrandStories().catch(() => [] as typeof brandStories),
    ]);
    featuredProducts = results[0];
    bestSellers = results[1];
    flashSales = results[2];
    banners = results[3];
    brandStories = results[4];

    if (flashSales.length > 0) {
      featuredProducts = applyFlashToProductList(featuredProducts, flashSales);
      bestSellers = applyFlashToProductList(bestSellers, flashSales);
    }
  } catch (error) {
    console.warn("Database unreachable in StorefrontHome, falling back to empty state:", error instanceof Error ? error.message : "unknown error");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = { 
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Myra Shopping Mall",
    url: appUrl,
    logo: `${appUrl}/displaypics/malllogo.png`,
    sameAs: [
      "https://www.facebook.com/people/MYRA-Shopping-Mall/61576471768505/",
      "https://instagram.com/myrashoppingmall"
    ]
  };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/\>/g, "\\u003e").replace(/<\//g, "\\u003c/");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <OpeningAnimation />
      <div className="w-full bg-[#EBDCD9]">

        {/* Mobile, Tablet & iPad Pro: Category Buttons at the top */}
        <div className="block xl:hidden">
          <CategoryButtons />
        </div>

        {/* 1. Hero Section */}
        <HeroGrid banners={banners} />

        {/* 1b. Flash Sale Banner */}
        <FlashSaleBanner sales={flashSales} />

        {/* 2. Desktop Category Buttons (15-inch Laptops & Desktops) */}
        <div className="hidden xl:block mt-6">
          <CategoryButtons />
        </div>

        {/* 3. Best Sellers */}
        <BestSellersSection products={bestSellers as any} />

        {/* 4. Marquee/Ticker */}
        <MarqueeSection />

        {/* 5. Bridal Elegance Banner */}
        <BridalBannerSection />

        {/* 6. New Arrivals */}
        <NewArrivalsSection products={featuredProducts as any} />

        {/* 6b. Recommended For You (personalized) */}
        <RecommendedForYou />

        {/* 7. Curated Collection Block */}
        <CuratedCollectionSection banners={banners} brandStories={brandStories} />

        {/* 8. Feature Icons Bar */}
        <FeatureIconsSection />

        {/* 9. Store Location Block */}
        <StoreLocationSection />

      </div>
    </>
  );
}
