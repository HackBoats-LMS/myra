import Image from "next/image";

export default function CuratedCollectionSection() {
  return (
    <section className="w-full bg-[#9c7d4e] py-12 md:py-24 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24">
        <div className="relative w-full md:w-1/2 h-[200px] md:h-[450px]">
          <Image src="/displaypics/landingpage9.png" alt="Curated Sarees" fill sizes="(max-width: 768px) 100vw, 50vw" quality={100} className="object-contain drop-shadow-2xl" />
        </div>
        <div className="text-center md:text-left space-y-4 md:space-y-6 max-w-sm text-white">
          <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/80">Where Every Saree Becomes a Statement</h4>
          <h2 className="text-2xl md:text-5xl font-serif leading-tight">Curated for Every Celebration</h2>
          <p className="text-[10px] md:text-sm text-white/90 leading-relaxed italic font-serif opacity-90">
            Hand-picked thoughtfully sourced collection of the highest quality pure silk sarees showcasing unique craftsmanship. We bring together a diverse range of styles, from traditional classics to contemporary masterpieces, ensuring there&rsquo;s a perfect saree for every special moment.
          </p>
        </div>
      </div>
    </section>
  );
}
