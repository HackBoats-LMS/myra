"use client";
import { useRef } from "react";
import ProductCard from "./ProductCard";

interface ProductCarouselProps {
  products: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    images: string[];
    reviewCount?: number;
    averageRating?: number;
    stockQuantity?: number;
    flashPercent?: number;
  }>;
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-between group">
      <button
        onClick={() => scrollByPage(-1)}
        className="hidden md:flex p-2 text-gray-400 hover:text-[#B6925B] transition-colors"
        aria-label="Scroll left"
      >
        <span className="text-4xl font-light">&lsaquo;</span>
      </button>
      <div
        ref={trackRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1 px-0 md:px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory"
      >
        {products.map((product) => (
          <div key={product.id} className="snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        onClick={() => scrollByPage(1)}
        className="hidden md:flex p-2 text-gray-400 hover:text-[#B6925B] transition-colors"
        aria-label="Scroll right"
      >
        <span className="text-4xl font-light">&rsaquo;</span>
      </button>
    </div>
  );
}