export default function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center w-full mb-6 sm:mb-8 md:mb-10 lg:mb-12 px-4">
      <div className="border-[#7A0B2E] border-t-2 border-b-2 flex items-center justify-center py-1.5 sm:py-2 md:py-2.5 px-5 sm:px-6 md:px-8 max-w-full">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif text-[#7A0B2E] tracking-tight text-center whitespace-nowrap">
          {title}
        </h2>
      </div>
    </div>
  );
}
