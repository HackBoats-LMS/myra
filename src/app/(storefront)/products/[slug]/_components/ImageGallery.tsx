"use client";
import { useState } from "react";
import Image from "next/image";

export default function ImageGallery({ images, alt, videoUrl }: { images: string[]; alt: string; videoUrl?: string | null }) {
  const [selected, setSelected] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ transform: "scale(1)" });

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    // Check extension before query string / fragment
    const pathname = url.split('?')[0].split('#')[0].toLowerCase();
    return pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.mov') || lower.includes('youtube.com') || lower.includes('youtu.be');
  };

  const getVideoMimeType = (url: string): string => {
    const pathname = url.split('?')[0].split('#')[0].toLowerCase();
    if (pathname.endsWith('.webm')) return 'video/webm';
    if (pathname.endsWith('.mov')) return 'video/mp4'; // MOV in browsers is treated as mp4
    return 'video/mp4'; // default
  };

  const mediaItems: { type: 'image' | 'video'; src: string }[] = images.map(src => ({
    type: isVideoUrl(src) ? ('video' as const) : ('image' as const),
    src
  }));

  if (videoUrl && !mediaItems.some(item => item.src === videoUrl)) {
    mediaItems.push({ type: 'video', src: videoUrl });
  }

  const firstImage = images.find(src => !isVideoUrl(src));

  if (mediaItems.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] flex items-center justify-center text-gray-300">
        No Media
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mediaItems[selected].type !== 'image') return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: "scale(1.8)",
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    if (mediaItems[selected].type !== 'image') return;
    setZoomStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full">
      {/* Thumbnail strip — Left side on Desktop */}
      {mediaItems.length > 1 && (
        <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-20 md:w-24 shrink-0 no-scrollbar order-2 sm:order-1">
          {mediaItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`
                relative flex-shrink-0 w-16 sm:w-full aspect-[3/4] bg-[#FAFAFA] overflow-hidden rounded-none transition-all border flex items-center justify-center
                ${selected === i
                  ? "border-[#7A0B2E] ring-1 ring-[#7A0B2E] opacity-100"
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-[#7A0B2E]/40"}
              `}
              aria-label={`View ${item.type} ${i + 1}`}
            >
              {item.type === 'image' ? (
                <Image
                  src={item.src}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 64px, 96px"
                  className="object-cover"
                />
              ) : (
                <>
                  {item.src.includes("youtube") || item.src.includes("youtu.be") ? (
                    <Image 
                      src={`https://img.youtube.com/vi/${item.src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)?.[1]}/default.jpg`}
                      alt="Video thumbnail"
                      fill
                      className="object-cover opacity-70"
                    />
                  ) : (
                    firstImage ? (
                      <Image 
                        src={firstImage}
                        alt="Video thumbnail"
                        fill
                        className="object-cover opacity-70"
                      />
                    ) : (
                      <video src={item.src} className="w-full h-full object-cover opacity-70" preload="metadata" />
                    )
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-1.5 backdrop-blur-sm">
                      <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main media container */}
      <div 
        className="relative flex-1 w-full bg-[#FAFAFA] overflow-hidden rounded-none border border-black/5 order-1 sm:order-2 flex flex-col justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: mediaItems[selected].type === 'image' ? 'zoom-in' : 'default' }}
      >
        {mediaItems[selected].type === 'image' ? (
          <Image
            src={mediaItems[selected].src}
            alt={alt}
            width={1200}
            height={1200}
            priority
            quality={100}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ ...zoomStyle, width: '100%', height: 'auto', objectFit: 'contain' }}
            className="transition-transform duration-150 ease-out block"
          />
        ) : (
          <div className="relative w-full bg-[#FAFAFA] flex items-center justify-center">
            {mediaItems[selected].src.includes("youtube") || mediaItems[selected].src.includes("youtu.be") ? (
               <iframe
                 src={`https://www.youtube.com/embed/${mediaItems[selected].src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)?.[1]}`}
                 className="w-full aspect-video"
                 title="Product video"
                 frameBorder="0"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
            ) : (
               <video 
                 key={mediaItems[selected].src}
                 controls 
                 className="w-full h-auto" 
                 autoPlay 
                 muted 
                 playsInline
                 poster={firstImage}
                 crossOrigin="anonymous"
               >
                 <source src={mediaItems[selected].src} type={getVideoMimeType(mediaItems[selected].src)} />
                 Your browser does not support the video tag.
               </video>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

