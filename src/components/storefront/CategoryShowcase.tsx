import Link from 'next/link';
import Image from 'next/image';
import type { Collection } from "@/generated/prisma";

export default function CategoryShowcase({ collections }: { collections: Collection[] }) {
  // Hardcoded mappings to match the visual design in the screenshot if images are missing
  const defaultImages: Record<string, string> = {
    'bridal': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop',
    'sarees': 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=200&h=200&fit=crop',
    'women': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    'kids': 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=200&h=200&fit=crop',
  };

  return (
    <section className="w-full pt-16 pb-12 px-4 max-w-7xl mx-auto flex flex-wrap gap-4 md:gap-8 justify-center items-center bg-white">
      {collections.map((collection) => {
        const imageSrc = collection.image || defaultImages[collection.slug] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop';
        return (
          <Link href={`/collections/${collection.slug}`} key={collection.id} className="cursor-pointer group">
            <div className="flex items-center bg-[#EADCC1] rounded-full pr-6 md:pr-10 py-1 pl-1 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-white/50 border-2 border-[#EADCC1]">
                <Image
                  src={imageSrc}
                  alt={collection.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-serif text-sm md:text-base font-bold text-[#4A3B2C] tracking-widest uppercase ml-4 md:ml-6 group-hover:text-[#B6925B] transition-colors">
                {collection.name}
              </span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
