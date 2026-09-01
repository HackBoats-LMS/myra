"use client";
import { useState } from "react";
import Image from "next/image";

export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ transform: "scale(1)" });

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] flex items-center justify-center text-gray-300">
        No Image
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: "scale(1.8)",
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full">
      {/* Thumbnail strip — Left side on Desktop */}
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-20 md:w-24 shrink-0 no-scrollbar order-2 sm:order-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`
                relative flex-shrink-0 w-16 sm:w-full aspect-[3/4] bg-[#FAFAFA] overflow-hidden rounded-none transition-all border
                ${selected === i
                  ? "border-[#B6925B] ring-1 ring-[#B6925B] opacity-100"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-[#B6925B]/40"}
              `}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="(max-width: 640px) 64px, 96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image container */}
      <div 
        className="relative flex-1 aspect-[3/4] sm:aspect-auto sm:min-h-[580px] md:min-h-[640px] lg:min-h-[680px] bg-[#FAFAFA] overflow-hidden rounded-none cursor-zoom-in border border-black/5 order-1 sm:order-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[selected] || images[0]}
          alt={alt}
          fill
          priority
          quality={100}
          sizes="(max-width: 768px) 100vw, 50vw"
          style={zoomStyle}
          className="object-cover transition-transform duration-150 ease-out"
        />
      </div>
    </div>
  );
}

