import Image from 'next/image';

export default function HeroGrid() {
  return (
    <section className="w-full max-w-[1920px] mx-auto bg-white flex flex-col lg:flex-row">
      {/* Main Left Banner */}
      {/* 60% width, 4:3 aspect ratio. Height = 60 * 0.75 = 45% of total width */}
      <div className="w-full lg:w-[60%] relative cursor-pointer aspect-[4/3]">
        <Image
          src="/displaypics/landingpage1.png"
          alt="Sale up to 50% off"
          fill
          priority
          quality={100}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover object-right"
        />
      </div>

      {/* Right Stacked Banners */}
      {/* 40% width. Each image is 16:9 aspect ratio. Height = 40 * 0.5625 = 22.5% each. Total height = 45% */}
      <div className="hidden lg:flex w-full lg:w-[40%] flex-col">
        <div className="w-full relative cursor-pointer aspect-[16/9]">
          <Image
            src="/displaypics/landingpage2.png"
            alt="Dresses collection"
            fill
            priority
            quality={100}
            sizes="40vw"
            className="object-cover object-center"
          />
        </div>
        <div className="w-full relative cursor-pointer aspect-[16/9]">
          <Image
            src="/displaypics/landingpage3.png"
            alt="Kids collection"
            fill
            priority
            quality={100}
            sizes="40vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}