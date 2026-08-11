import Image from 'next/image';

export default function HeroGrid() {
  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-12 max-w-[1920px] mx-auto bg-white">
      {/* Main Left Banner */}
      {/* Since the image has the text baked in, we just display the image */}
      <div className="lg:col-span-8 relative min-h-[500px] lg:min-h-[750px] overflow-hidden flex items-center justify-start">
        <Image 
          src="/displaypics/50offsale.png" 
          alt="Main Sale Banner" 
          fill 
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover absolute inset-0 z-0" 
        />
      </div>

      {/* Right Stacked Banners */}
      <div className="lg:col-span-4 flex flex-col">
        {/* Top Right Banner */}
        <div className="flex-1 relative min-h-[350px] border-b-[8px] border-white lg:border-b-0 lg:border-l-[8px] overflow-hidden group cursor-pointer">
           <Image 
             src="/displaypics/dressesthatdefine.png" 
             alt="Dresses Banner" 
             fill 
             priority
             sizes="(max-width: 768px) 100vw, 33vw"
             className="object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-700" 
           />
        </div>

        {/* Bottom Right Banner */}
        <div className="flex-1 relative min-h-[350px] lg:border-l-[8px] border-white overflow-hidden group cursor-pointer">
           <Image 
             src="/displaypics/70offsale.png" 
             alt="Kids Sale Banner" 
             fill 
             priority
             sizes="(max-width: 768px) 100vw, 33vw"
             className="object-cover absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-700" 
           />
        </div>
      </div>
    </section>
  );
}
