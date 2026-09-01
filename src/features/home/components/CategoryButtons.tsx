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
    image: '/displaypics/home/bridal/image.png',
    style: {
      desktop: { width: '46%', height: '180%', left: '16px', bottom: '0px', scale: 1.15 },
      mobile: { width: '80%', height: '140%', bottom: '0px', scale: 1.15 },
    },
  },
  {
    name: 'SAREES',
    href: '/collections/sarees',
    image: '/displaypics/home/sarees/image.png',
    style: {
      desktop: { width: '46%', height: '180%', left: '16px', bottom: '0px', scale: 1.0 },
      mobile: { width: '80%', height: '140%', bottom: '0px', scale: 1.1 },
    },
  },
  {
    name: 'WOMEN',
    href: '/collections/women',
    image: '/displaypics/home/women/image.png',
    style: {
      desktop: { width: '46%', height: '150%', left: '16px', bottom: '0px', scale: 1.0 },
      mobile: { width: '80%', height: '130%', bottom: '0px', scale: 1.1 },
    },
  },
  {
    name: 'KIDS',
    href: '/collections/kids',
    image: '/displaypics/home/kids/image.png',
    style: {
      desktop: { width: '46%', height: '180%', left: '16px', bottom: '0px', scale: 1.0 },
      mobile: { width: '80%', height: '140%', bottom: '0px', scale: 1.1 },
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
      <div className="absolute bottom-0 left-0 right-0 h-[56px] sm:h-[72px] md:h-[98px] lg:h-[115px] pointer-events-none z-10 flex justify-center items-end origin-bottom">
        <div
          className="relative w-[50px] sm:w-[65px] md:w-[90px] lg:w-[105px] h-full"
          style={{
            width: m?.width,
            height: m?.height,
            bottom: m?.bottom,
            transform: m?.transform ?? (m?.scale && m.scale !== 1 ? `scale(${m.scale})` : undefined),
          }}
        >
          <Image
            src={imgSrc}
            alt={cat.name}
            fill
            quality={100}
            sizes="(max-width: 640px) 70px, 150px"
            className="object-contain object-bottom drop-shadow-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile, Tablet & iPad Pro Layout (< 1280px): Scaled Oval Capsules with Labels Below (at top of page) */}
      <section className="xl:hidden w-full px-2 sm:px-4 md:px-8 lg:px-12 pt-12 sm:pt-16 md:pt-24 lg:pt-28 pb-2.5 sm:pb-3 md:pb-4 lg:pb-5 bg-white border-b border-[#B6925B]/15">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-start justify-items-center max-w-[960px] mx-auto">
          {categories.map((cat) => (
            <Link
              href={cat.href}
              key={cat.name}
              className="flex flex-col items-center gap-1.5 sm:gap-2.5 md:gap-3 w-full max-w-[85px] sm:max-w-[110px] md:max-w-[145px] lg:max-w-[170px] group cursor-pointer"
            >
              {/* Oval Capsule */}
              <div className="relative w-[74px] sm:w-[96px] md:w-[130px] lg:w-[155px] h-[40px] sm:h-[52px] md:h-[68px] lg:h-[80px] rounded-full bg-[#E8D3BA] shadow-sm transition-transform duration-200 group-hover:scale-105">
                {/* Popout Image Layer */}
                <div className="absolute inset-0 pointer-events-none [clip-path:inset(-150px_-50px_0px_-50px)]">
                  {renderMobileImages(cat)}
                </div>
              </div>

              {/* Label Below */}
              <span className="font-serif font-bold text-[10px] sm:text-xs md:text-sm lg:text-base tracking-wider text-[#111111] uppercase text-center leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 15-inch Laptop & Desktop Layout (1280px+): Horizontal Pills with Embedded Text */}
      <section className="hidden xl:block w-full max-w-[1500px] mx-auto px-6 xl:px-8 py-16 bg-transparent">
        <div className="grid grid-cols-4 gap-12 xl:gap-18 items-center justify-items-center">
          {categories.map((cat) => (
            <Link
              href={cat.href}
              key={cat.name}
              className="relative group block w-full max-w-[325px] h-[112px] xl:h-[125px] cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
            >
              {/* Base Pill Capsule Layer */}
              <div className="absolute inset-0 bg-[#E8D3BA] rounded-full overflow-hidden shadow-sm transition-shadow duration-300 group-hover:shadow-md">
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
