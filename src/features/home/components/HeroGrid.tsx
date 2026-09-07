import Link from 'next/link';
import SafeImage from '@/components/shared/SafeImage';
import { getCachedBanners } from '@/lib/cache';

export default async function HeroGrid() {
  let banners: Awaited<ReturnType<typeof getCachedBanners>> = [];
  try {
    banners = await getCachedBanners();
  } catch (err) {
    console.warn("Failed to load cached banners in HeroGrid, falling back to defaults:", err);
  }

  const heroMain = banners.find((b) => b.slot === "hero_main");
  const heroRightTop = banners.find((b) => b.slot === "hero_right_top");
  const heroRightBottom = banners.find((b) => b.slot === "hero_right_bottom");

  const defaultMainSrc = "/displaypics/hero-main.png";
  const mainSrc = heroMain?.imageUrl || defaultMainSrc;
  const mainAlt = heroMain?.altText || heroMain?.title || "Sale up to 50% off";
  const mainHref = heroMain?.linkUrl || "/collections";

  const defaultTopSrc = "/displaypics/landingpage2.png";
  const topSrc = heroRightTop?.imageUrl || defaultTopSrc;
  const topAlt = heroRightTop?.altText || heroRightTop?.title || "Dresses collection";
  const topHref = heroRightTop?.linkUrl || "/collections/women";

  const defaultBottomSrc = "/displaypics/landingpage3.png";
  const bottomSrc = heroRightBottom?.imageUrl || defaultBottomSrc;
  const bottomAlt = heroRightBottom?.altText || heroRightBottom?.title || "Kids collection";
  const bottomHref = heroRightBottom?.linkUrl || "/collections/kids";

  return (
    <section suppressHydrationWarning className="w-full max-w-[1920px] mx-auto bg-transparent flex flex-col xl:flex-row">
      {/* Main Banner (Full width on iPads/mobile, 60% on desktop) */}
      <div suppressHydrationWarning className="w-full xl:w-[60%] relative cursor-pointer aspect-[3/2]">
        <Link suppressHydrationWarning href={mainHref} className="block w-full h-full relative">
          <SafeImage
            src={mainSrc}
            fallbackSrc={defaultMainSrc}
            alt={mainAlt}
            fill
            priority
            quality={90}
            sizes="(max-width: 1280px) 100vw, 60vw"
            unoptimized={mainSrc.startsWith("http")}
            className="object-cover object-center"
          />
        </Link>
      </div>

      {/* Sub-Banners: Decreased container height (aspect-[699/374]) so full width fits with no side cropping */}
      <div suppressHydrationWarning className="flex w-full xl:w-[40%] flex-row xl:flex-col">
        <div suppressHydrationWarning className="w-1/2 xl:w-full relative cursor-pointer aspect-[699/374] xl:aspect-auto xl:flex-1 overflow-hidden">
          <Link suppressHydrationWarning href={topHref} className="block w-full h-full relative">
            <SafeImage
              src={topSrc}
              fallbackSrc={defaultTopSrc}
              alt={topAlt}
              fill
              priority
              quality={90}
              sizes="(max-width: 1280px) 50vw, 40vw"
              unoptimized={topSrc.startsWith("http")}
              className="object-cover object-left"
            />
          </Link>
        </div>
        <div suppressHydrationWarning className="w-1/2 xl:w-full relative cursor-pointer aspect-[699/374] xl:aspect-auto xl:flex-1 overflow-hidden">
          <Link suppressHydrationWarning href={bottomHref} className="block w-full h-full relative">
            <SafeImage
              src={bottomSrc}
              fallbackSrc={defaultBottomSrc}
              alt={bottomAlt}
              fill
              priority
              quality={90}
              sizes="(max-width: 1280px) 50vw, 40vw"
              unoptimized={bottomSrc.startsWith("http")}
              className="object-cover object-left"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
