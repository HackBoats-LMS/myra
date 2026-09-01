import Image from "next/image";

export default function StoreLocationSection() {
  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=Myra+Shopping+Mall+5-155+G+Plus+3+Floors+Koritepadu+Rd+Vinayak+Nagar+Guntur+Andhra+Pradesh+522007";

  return (
    <section className="w-full bg-[#FAFAFA] py-10 sm:py-14 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 border-t border-[#B6925B]/10">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-8 lg:gap-14 xl:gap-20">
        
        {/* Storefront Image */}
        <div className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[320px] lg:max-w-[420px] xl:max-w-[460px] aspect-[3/4] overflow-hidden rounded-none shadow-md shrink-0">
          <Image
            src="/displaypics/myra.png"
            alt="Myra Shopping Mall Guntur"
            fill
            quality={100}
            sizes="(max-width: 768px) 90vw, (max-width: 1024px) 40vw, 460px"
            className="object-cover object-center"
          />
        </div>

        {/* Store Information Details */}
        <div className="flex flex-col items-center text-center w-full max-w-[480px] md:max-w-[380px] lg:max-w-[480px] px-2 sm:px-4 shrink-0">
          
          {/* Main Title */}
          <h2 className="font-serif text-2xl sm:text-3xl md:text-[23px] lg:text-[32px] xl:text-[36px] text-[#BA8F4D] tracking-normal leading-tight font-medium whitespace-normal md:whitespace-nowrap lg:whitespace-normal">
            Visit Myra Shopping Mall
          </h2>

          {/* Subtitle - tightly spaced below heading */}
          <h3 className="font-serif text-sm sm:text-base md:text-sm lg:text-lg xl:text-xl text-[#BA8F4D] font-normal tracking-wide mt-1.5 md:mt-1.5 lg:mt-2">
            Your Fashion Destination in Guntur
          </h3>

          {/* Description Paragraph */}
          <p className="font-serif text-[11px] sm:text-xs md:text-[11px] lg:text-[13px] text-[#BA8F4D] leading-relaxed mt-3 md:mt-3.5 lg:mt-5 max-w-[460px]">
            Located in the heart of Guntur, Myra Shopping Mall offers an exceptional shopping experience with an extensive collection of premium sarees and women&apos;s fashion. Visit our showroom to explore the latest styles and enjoy personalized service in a welcoming atmosphere.
          </p>

          {/* Address with Gold Location Pin */}
          <div className="flex items-center justify-center gap-2 mt-3.5 md:mt-4 lg:mt-6 max-w-[420px]">
            <span className="shrink-0 flex items-center justify-center self-center">
              <svg
                width="21"
                height="26"
                viewBox="0 0 21 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-4.5 sm:w-4 sm:h-5 shrink-0"
              >
                <path
                  d="M10.5 22.0494L16.2746 16.2747C19.464 13.0855 19.464 7.91457 16.2746 4.72529C13.0854 1.53601 7.91457 1.53601 4.72529 4.72529C1.53601 7.91457 1.53601 13.0855 4.72529 16.2747L10.5 22.0494ZM10.5 25.3492L3.07538 17.9247C-1.02513 13.8241 -1.02513 7.17589 3.07538 3.07538C7.17589 -1.02513 13.8241 -1.02513 17.9247 3.07538C22.0252 7.17589 22.0252 13.8241 17.9247 17.9247L10.5 25.3492ZM10.5 12.8333C11.7887 12.8333 12.8333 11.7887 12.8333 10.5C12.8333 9.21133 11.7887 8.16667 10.5 8.16667C9.2113 8.16667 8.16667 9.21133 8.16667 10.5C8.16667 11.7887 9.2113 12.8333 10.5 12.8333ZM10.5 15.1667C7.92267 15.1667 5.83333 13.0773 5.83333 10.5C5.83333 7.92267 7.92267 5.83333 10.5 5.83333C13.0773 5.83333 15.1667 7.92267 15.1667 10.5C15.1667 13.0773 13.0773 15.1667 10.5 15.1667Z"
                  fill="#BF9351"
                />
              </svg>
            </span>
            <p className="font-serif text-[10px] sm:text-xs md:text-[11px] lg:text-[12.5px] text-[#BA8F4D] leading-snug">
              5-155, G Plus 3 Floors, 4, Koritepadu Rd, Vinayak Nagar, Guntur, Andhra Pradesh 522007
            </p>
          </div>

          {/* View on Maps Pill Button */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#BA8D48] hover:bg-[#A67B37] text-white px-5 sm:px-7 md:px-6 lg:px-8 py-2 sm:py-2.5 rounded-full font-serif text-[11px] sm:text-xs md:text-xs lg:text-[13px] tracking-wide transition-all duration-300 shadow hover:shadow-md hover:scale-[1.02] mt-3.5 md:mt-4 lg:mt-6 active:scale-95"
          >
            <svg
              width="18"
              height="22"
              viewBox="0 0 18 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-3 h-3.5 sm:w-3.5 sm:h-4 lg:w-4 lg:h-4.5 shrink-0"
            >
              <path
                d="M15.364 15.364L9 21.7279L2.63604 15.364C-0.87868 11.8492 -0.87868 6.15076 2.63604 2.63604C6.15076 -0.87868 11.8492 -0.87868 15.364 2.63604C18.8787 6.15076 18.8787 11.8492 15.364 15.364ZM9 13C11.2091 13 13 11.2091 13 9C13 6.79086 11.2091 5 9 5C6.79086 5 5 6.79086 5 9C5 11.2091 6.79086 13 9 13ZM9 11C7.8954 11 7 10.1046 7 9C7 7.89543 7.8954 7 9 7C10.1046 7 11 7.89543 11 9C11 10.1046 10.1046 11 9 11Z"
                fill="white"
              />
            </svg>
            <span>View on Maps</span>
          </a>

        </div>

      </div>
    </section>
  );
}
