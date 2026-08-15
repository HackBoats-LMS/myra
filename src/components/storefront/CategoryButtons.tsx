import Link from 'next/link';
import Image from 'next/image';

interface CategoryButtonImageStyle {
  left: string;
  width: string;
  height: string;
  zIndex: number;
}

interface CategoryButton {
  name: string;
  href: string;
  images: string[];
  imgStyles?: CategoryButtonImageStyle[];
}

const categories: CategoryButton[] = [
  { 
    name: 'BRIBAL', 
    href: '/collections/bridal', 
    images: ['/displaypics/Bridel.png'] 
  },
  { 
    name: 'SAREES', 
    href: '/collections/sarees', 
    images: ['/displaypics/saree1.png', '/displaypics/saree2.png'],
    imgStyles: [
      { left: '0%', width: '65%', height: '90%', zIndex: 1 },
      { left: '22%', width: '70%', height: '105%', zIndex: 2 }
    ]
  },
  { 
    name: 'WOMEN', 
    href: '/collections/women', 
    images: ['/displaypics/women1.png', '/displaypics/women2.png'],
    imgStyles: [
      { left: '5%', width: '65%', height: '95%', zIndex: 1 },
      { left: '25%', width: '70%', height: '98%', zIndex: 2 }
    ]
  },
  { 
    name: 'KIDS', 
    href: '/collections/kids', 
    images: ['/displaypics/kids1.png', '/displaypics/kids2.png'],
    imgStyles: [
      { left: '8%', width: '65%', height: '92%', zIndex: 1 },
      { left: '28%', width: '70%', height: '96%', zIndex: 2 }
    ]
  },
];

export default function CategoryButtons() {
  const renderImageGroup = (cat: CategoryButton) => (
    <div className="absolute bottom-0 left-[2px] md:left-[15px] w-[45px] md:w-[145px] h-[48px] md:h-[140px] pointer-events-none z-10 origin-bottom">
      {cat.images.length === 1 ? (
        <div className="relative w-full h-full">
          <Image
            src={cat.images[0]}
            alt={cat.name}
            fill
            quality={100}
            sizes="(max-width: 768px) 50px, 180px"
            className="object-contain object-bottom drop-shadow-lg"
          />
        </div>
      ) : (
        <div className="relative w-full h-full flex justify-center items-end">
          {cat.images.map((img: string, i: number) => (
            <div
              key={img}
              className="absolute bottom-0"
              style={cat.imgStyles ? cat.imgStyles[i] : {}}
            >
              <Image
                src={img}
                alt={cat.name}
                fill
                quality={100}
                sizes="(max-width: 768px) 50px, 140px"
                className="object-contain object-bottom drop-shadow-lg"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="w-full max-w-[1400px] mx-auto px-2 md:px-8 py-10 md:py-20 bg-transparent overflow-x-hidden">
      <div className="flex justify-between items-center md:flex-wrap md:justify-center md:gap-x-12 gap-x-1 gap-y-24">
        {categories.map((cat) => (
          <Link
            href={cat.href}
            key={cat.name}
            className="relative group block w-[84px] md:w-[280px] h-[30px] md:h-[85px] cursor-pointer shrink-0"
          >
            <div className="absolute inset-0 bg-[#E8D3BA] rounded-full overflow-hidden shadow-sm">
              {renderImageGroup(cat)}
            </div>
            
            {/* Top Layer: Allows overflow on top for heads to pop out, but clips the bottom curvature */}
            <div className="absolute inset-0 pointer-events-none [clip-path:inset(-100px_-100px_16px_-100px)] md:[clip-path:inset(-100px_-100px_43px_-100px)]">
              {renderImageGroup(cat)}
            </div>

            {/* Text Container */}
            <div className="absolute inset-y-0 right-0 left-[48px] md:left-[150px] flex items-center justify-center pointer-events-none z-20">
              <span className="font-serif font-bold tracking-widest text-[#1a1a1a] text-[8px] md:text-xl">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}