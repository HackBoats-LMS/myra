import Image from 'next/image';

export default function HeroGrid() {
  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-12 max-w-[1920px] mx-auto bg-white lg:min-h-[calc(100dvh-6.6rem)]">
      {/* Main Left Banner — fills the viewport on mobile */}
      <div className="relative lg:col-span-8 h-[calc(100dvh-6rem)] md:h-[calc(100dvh-6.6rem)] lg:h-auto overflow-hidden flex items-center justify-start">
        <Image
          src="/displaypics/hero-main-2.jpg"
          alt="Indian bride in traditional red saree"
          fill
          priority
          quality={100}
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover absolute inset-0 z-0"
        />
      </div>

      {/* Right Stacked Banners — hidden on mobile, side-by-side on desktop */}
      <div className="hidden lg:flex lg:col-span-4 flex-col">
        <div className="flex-1 relative min-h-[220px] overflow-hidden group cursor-pointer">
          <Image
            src="/displaypics/hero-right1-2.jpg"
            alt="Woman in elegant red ethnic dress"
            fill
            priority
            quality={100}
            sizes="33vw"
            className="object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="flex-1 relative min-h-[220px] border-t-[8px] border-white overflow-hidden group cursor-pointer">
          <Image
            src="/displaypics/hero-right2-2.jpg"
            alt="Elegant woman in traditional saree"
            fill
            priority
            quality={100}
            sizes="33vw"
            className="object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </div>
    </section>
  );
}