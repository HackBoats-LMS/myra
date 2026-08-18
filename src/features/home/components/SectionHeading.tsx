export default function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
      <div className="h-[1px] w-16 md:w-32 bg-[#B6925B]/50"></div>
      <h2 className="text-2xl md:text-4xl font-serif text-[#B6925B] tracking-wider">{title}</h2>
      <div className="h-[1px] w-16 md:w-32 bg-[#B6925B]/50"></div>
    </div>
  );
}
