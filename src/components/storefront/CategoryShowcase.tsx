import Link from 'next/link';

export default function CategoryShowcase({ collections }: { collections: any[] }) {
  return (
    <section className="w-full pt-20 pb-12 px-8 max-w-7xl mx-auto flex flex-wrap gap-6 md:gap-10 justify-center items-end bg-white">
      {collections.map((collection) => (
        <Link href={`/collections/${collection.slug}`} key={collection.id} className="flex flex-col items-center gap-4 cursor-pointer group">
          {/* Aesthetic rounded pill shape for collections */}
          <div className="w-32 h-44 md:w-48 md:h-64 bg-[#f4f4f4] rounded-t-full rounded-b-xl flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:shadow-md group-hover:-translate-y-2">
            <span className="font-serif text-lg md:text-xl text-gray-800 tracking-wide z-10 group-hover:scale-110 transition-transform duration-500">{collection.name}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
