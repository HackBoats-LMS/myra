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
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Thumbnail strip — only shown when more than 1 image (Left side on Desktop) */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-20 order-2 md:order-1 no-scrollbar shrink-0">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`
                relative flex-shrink-0 w-16 md:w-full aspect-[3/4] bg-[#FAFAFA] overflow-hidden rounded-none transition-all border
                ${selected === i
                  ? "border-[#B6925B] ring-1 ring-[#B6925B]"
                  : "border-transparent opacity-60 hover:opacity-100"}
              `}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image container with Zoom capabilities (Right side on Desktop) */}
      <div 
        className="relative flex-1 aspect-[3/4] md:aspect-auto md:h-[560px] xl:h-[640px] bg-[#FAFAFA] overflow-hidden rounded-none cursor-zoom-in border border-[#B6925B]/20 order-1 md:order-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[selected]}
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
