"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

export interface StoryItem {
  id: string;
  number: string;
  subtitle: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

export default function CuratedCollectionClient({ stories }: { stories: StoryItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const storyRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const isDesktop = window.innerWidth >= 1024;
      // On mobile, the focal trigger is in the lower portion of the screen below the sticky image
      const focalLine = isDesktop ? window.innerHeight * 0.5 : window.innerHeight * 0.68;

      let closestIdx = 0;
      let minDistance = Infinity;

      storyRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const blockCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(focalLine - blockCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });

      setActiveIndex((prev) => (prev !== closestIdx ? closestIdx : prev));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="w-full bg-[#b88d4c] text-white py-12 md:py-24 lg:py-32 px-4 sm:px-8 md:px-14 lg:px-12 xl:px-24 font-serif">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-14 lg:gap-12 xl:gap-24 items-start">
        
        {/* Sticky Image Frame (Sticky on both Mobile Top & Desktop Left) */}
        <div className="xl:col-span-6 sticky top-16 sm:top-20 xl:top-[calc(50vh-230px)] z-20 bg-[#b88d4c] py-3 xl:py-0 flex items-center justify-center">
          <div className="relative w-full max-w-[450px] sm:max-w-[550px] lg:max-w-[650px] aspect-[4/3] overflow-hidden flex items-center justify-center">
            {stories.map((story, idx) => {
              const isCurrent = activeIndex === idx;
              return (
                <div
                  key={story.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out flex items-center justify-center ${
                    isCurrent
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-[0.98] pointer-events-none"
                  }`}
                >
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="500px"
                    quality={100}
                    priority={idx === 0}
                    unoptimized={story.image.startsWith("http")}
                    className="object-contain object-center"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrolling Narrative Text with Focal Illumination */}
        <div className="xl:col-span-6 flex flex-col space-y-48 sm:space-y-64 xl:space-y-80 pt-4 pb-16 xl:py-20 z-10">
          {stories.map((story, idx) => {
            const isCurrent = activeIndex === idx;

            return (
              <div
                key={story.id}
                ref={(el) => {
                  storyRefs.current[idx] = el;
                }}
                className={`transition-all duration-700 ease-out flex flex-col justify-center text-center max-w-sm sm:max-w-md lg:max-w-lg mx-auto ${
                  isCurrent
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-25 translate-y-3 scale-[0.98]"
                }`}
              >
                {/* Subtitle / Eyebrow */}
                <p className="text-lg sm:text-xl lg:text-[22px] text-white font-bold font-serif leading-snug mb-2 sm:mb-3">
                  {story.subtitle}
                </p>

                {/* Main Headline */}
                <h2 className="text-base sm:text-lg lg:text-[40px] font-serif leading-snug lg:leading-[1.18] text-white font-normal mb-3 sm:mb-4">
                  {story.title}
                </h2>

                {/* Description Narrative */}
                <p className="text-xs sm:text-[13px] lg:text-[14px] font-bold leading-relaxed text-white/90 font-serif opacity-90 max-w-xs sm:max-w-sm lg:max-w-md mx-auto">
                  {story.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
