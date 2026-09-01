import Image from 'next/image';
import Link from 'next/link';
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

  const mainSrc = heroMain?.imageUrl || "/displaypics/hero-main.png";
  const mainAlt = heroMain?.altText || heroMain?.title || "Sale up to 50% off";
  const mainHref = heroMain?.linkUrl || "/collections";

  const topSrc = heroRightTop?.imageUrl || "/displaypics/landingpage2.png";
  const topAlt = heroRightTop?.altText || heroRightTop?.title || "Dresses collection";
  const topHref = heroRightTop?.linkUrl || "/collections/women";

  const bottomSrc = heroRightBottom?.imageUrl || "/displaypics/landingpage3.png";
  const bottomAlt = heroRightBottom?.altText || heroRightBottom?.title || "Kids collection";
  const bottomHref = heroRightBottom?.linkUrl || "/collections/kids";

  return (
    <section className="w-full max-w-[1920px] mx-auto bg-white flex flex-col xl:flex-row">
      {/* Main Banner (Full width on iPads/mobile, 60% on desktop) */}
      <div className="w-full xl:w-[60%] relative cursor-pointer aspect-[3/2]">
        <Link href={mainHref} className="block w-full h-full relative">
          <Image
            src={mainSrc}
            alt={mainAlt}
            fill
            priority
            quality={100}
            sizes="(max-width: 1280px) 100vw, 60vw"
            unoptimized={mainSrc.startsWith("http")}
            className="object-cover object-center"
          />
        </Link>
      </div>

      {/* Sub-Banners (Side-by-side 50% each on iPads/mobile, stacked vertically on desktop) */}
      <div className="flex w-full xl:w-[40%] flex-row xl:flex-col">
        <div className="w-1/2 xl:w-full relative cursor-pointer aspect-[16/10] xl:aspect-auto xl:flex-1">
          <Link href={topHref} className="block w-full h-full relative">
            <Image
              src={topSrc}
              alt={topAlt}
              fill
              priority
              quality={100}
              sizes="(max-width: 1280px) 50vw, 40vw"
              unoptimized={topSrc.startsWith("http")}
              className="object-cover object-center"
            />
          </Link>
        </div>
        <div className="w-1/2 xl:w-full relative cursor-pointer aspect-[16/10] xl:aspect-auto xl:flex-1">
          <Link href={bottomHref} className="block w-full h-full relative">
            <Image
              src={bottomSrc}
              alt={bottomAlt}
              fill
              priority
              quality={100}
              sizes="(max-width: 1280px) 50vw, 40vw"
              unoptimized={bottomSrc.startsWith("http")}
              className="object-cover object-center"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
