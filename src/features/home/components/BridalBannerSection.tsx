import Link from "next/link";
import Image from "next/image";
import { getCachedBanners } from "@/lib/cache";

export default async function BridalBannerSection() {
  let banners: Awaited<ReturnType<typeof getCachedBanners>> = [];
  try {
    banners = await getCachedBanners();
  } catch (err) {
    console.warn("Failed to load cached banners in BridalBannerSection:", err);
  }

  const bridal = banners.find((b) => b.slot === "bridal_banner");
  const src = bridal?.imageUrl || "/displaypics/bribal poster.png";
  const href = bridal?.linkUrl || "/collections/bridal";
  const alt = bridal?.altText || bridal?.title || "Bridal Collection";

  return (
    <Link href={href} className="block w-full relative cursor-pointer">
      <Image
        src={src}
        alt={alt}
        width={1920}
        height={600}
        sizes="100vw"
        quality={100}
        unoptimized={src.startsWith("http")}
        className="w-full h-auto object-cover"
      />
    </Link>
  );
}
