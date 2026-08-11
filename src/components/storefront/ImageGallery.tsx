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
    <div className="flex flex-col gap-3">
      {/* Main image container with Zoom capabilities */}
      <div 
        className="relative aspect-[3/4] w-full bg-[#f8f8f8] overflow-hidden rounded-md cursor-zoom-in border border-gray-100"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[selected]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={zoomStyle}
          className="object-cover transition-transform duration-150 ease-out"
        />
      </div>

      {/* Thumbnail strip — only shown when more than 1 image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mt-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`
                relative flex-shrink-0 w-16 h-20 bg-[#f8f8f8] overflow-hidden rounded-md transition-all border
                ${selected === i
                  ? "border-[#0D3B66] ring-1 ring-[#0D3B66] scale-[0.98]"
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
    </div>
  );
}
