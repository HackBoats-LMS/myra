import Link from 'next/link';
import Image from 'next/image';

export interface CategoryImageStyle {
  width?: string;      // e.g. '46%', '50%', '60px'
  height?: string;     // e.g. '180%', '100%', '120px'
  left?: string;       // e.g. '16px', '0%', '10px'
  bottom?: string;     // e.g. '0px', '-4px', '8px'
  scale?: number;      // e.g. 1.0, 1.15, 0.95
  transform?: string;  // e.g. 'translateY(2px)'
}

export interface CategoryButton {
  name: string;
  href: string;
  image: string;
  images?: string[];
  style?: {
    desktop?: CategoryImageStyle;
    mobile?: CategoryImageStyle;
  };
}

/**
 * Categories configuration with customizable sizing and positioning.
 * Modify `style.desktop` and `style.mobile` for fine-tuning each category image.
 */
const categories: CategoryButton[] = [
  {
    name: 'BRIDAL',
    href: '/collections/bridal',
    image: '/displaypics/home/bridal/image3.png',
    style: {
      desktop: { width: '43%', height: '115%', left: '16px', bottom: '0px', scale: 1.15 },
      mobile: { width: '75%', height: '130%', bottom: '0px', scale: 1.15 },
    },
  },
  {
    name: 'SAREES',
    href: '/collections/sarees',
    image: '/displaypics/home/sarees/image.png',
    style: {
      desktop: { width: '46%', height: '180%', left: '16px', bottom: '0px', scale: 1.0 },
      mobile: { width: '75%', height: '140%', bottom: '0px', scale: 1.1 },
    },
  },
  {
    name: 'WOMEN',
    href: '/collections/women',
    image: '/displaypics/home/women/image.png',
    style: {
      desktop: { width: '46%', height: '150%', left: '16px', bottom: '0px', scale: 1.0 },
      mobile: { width: '75%', height: '130%', bottom: '0px', scale: 1.1 },
    },
  },
];

export default function CategoryButtons() {
  const getImgSrc = (cat: CategoryButton) => cat.image || cat.images?.[0] || '';

  const renderDesktopImages = (cat: CategoryButton) => {
    const d = cat.style?.desktop;
    const imgSrc = getImgSrc(cat);

    return (
      <div
        className="absolute bottom-0 pointer-events-none z-10 origin-bottom"
        style={{
          left: d?.left ?? '12px',
          width: d?.width ?? '46%',
          height: d?.height ?? '180%',
          bottom: d?.bottom ?? '0px',
          transform: d?.transform ?? (d?.scale && d.scale !== 1 ? `scale(${d.scale})` : undefined),
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src={imgSrc}
            alt={cat.name}
            fill
            quality={100}
            sizes="260px"
            className="object-contain object-bottom drop-shadow-md"
          />
        </div>
      </div>
    );
  };

  const renderMobileImages = (cat: CategoryButton) => {
    const m = cat.style?.mobile;
    const imgSrc = getImgSrc(cat);

    return (
      <div className="absolute bottom-0 left-0 right-0 h-[66px] sm:h-[82px] md:h-[100px] lg:h-[115px] pointer-events-none z-10 flex justify-center items-end origin-bottom">
        <div
          className="relative w-[74px] sm:w-[94px] md:w-[115px] lg:w-[125px] h-full"
          style={{
            width: m?.width,
            height: m?.height,
            bottom: m?.bottom,
            transform: m?.transform ?? (m?.scale && m.scale !== 1 ? `scale(${m.scale})` : undefined),
          }}
        >
          <Image
            suppressHydrationWarning
            src={imgSrc}
            alt={cat.name}
            fill
            quality={100}
            sizes="(max-width: 640px) 110px, 160px"
            className="object-contain object-bottom drop-shadow-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile, Tablet & iPad Pro Layout (< 1280px): Scaled Oval Capsules with Labels Below (at top of page) */}
      <section suppressHydrationWarning className="xl:hidden w-full px-3 sm:px-6 md:px-8 lg:px-12 pt-16 sm:pt-20 md:pt-24 lg:pt-28 pb-3 sm:pb-4 md:pb-5 bg-transparent border-b border-[#7A0B2E]/15">
        <div suppressHydrationWarning className="flex flex-nowrap items-start justify-center gap-6 sm:gap-10 md:gap-14 max-w-[420px] sm:max-w-[960px] mx-auto">
          {categories.map((cat) => (
            <Link
              suppressHydrationWarning
              href={cat.href}
              key={cat.name}
              className="flex flex-col items-center gap-2 sm:gap-2.5 md:gap-3 group cursor-pointer shrink-0"
            >
              {/* Oval Capsule Background Bar (Wide 102px pill) */}
              <div suppressHydrationWarning className="relative w-[102px] sm:w-[130px] md:w-[160px] lg:w-[180px] h-[44px] sm:h-[56px] md:h-[68px] lg:h-[80px] rounded-full bg-[#C3A29B] shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-[#BA9790]">
                {/* Popout Image Layer */}
                <div suppressHydrationWarning className="absolute inset-0 pointer-events-none [clip-path:inset(-150px_-6px_0px_-6px)]">
                  {renderMobileImages(cat)}
                </div>
              </div>

              {/* Label Below */}
              <span className="font-serif font-bold text-xs sm:text-sm md:text-base tracking-wider text-[#111111] uppercase text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 15-inch Laptop & Desktop Layout (1280px+): Horizontal Pills with Embedded Text */}
      <section className="hidden xl:block w-full max-w-[1500px] mx-auto px-6 xl:px-8 py-16 bg-transparent">
        <div className="flex flex-wrap items-center justify-center gap-10 xl:gap-16">
          {categories.map((cat) => (
            <Link
              href={cat.href}
              key={cat.name}
              className="relative group block w-[300px] xl:w-[325px] h-[112px] xl:h-[125px] cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
            >
              {/* Base Pill Capsule Layer */}
              <div className="absolute inset-0 bg-[#C3A29B] rounded-full overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:bg-[#BA9790]">
                {renderDesktopImages(cat)}
              </div>

              {/* Top Layer: Allows overflow on top for heads/bodies to pop out */}
              <div className="absolute inset-0 pointer-events-none [clip-path:inset(-200px_-100px_50%_-100px)]">
                {renderDesktopImages(cat)}
              </div>

              {/* Text Container: Perfectly centered in right half */}
              <div className="absolute inset-y-0 right-2 sm:right-4 md:right-6 left-[44%] sm:left-[46%] flex items-center justify-center pointer-events-none z-20">
                <span className="font-serif font-bold tracking-[0.08em] text-[#000000] text-xl xl:text-[26px] text-center leading-none select-none">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
