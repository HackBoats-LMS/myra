"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import CountdownTimer from "@/components/shared/CountdownTimer";

export default function FlashSaleBannerClient({
  title,
  discountLabel,
  collectionName,
  endAt,
  href,
}: {
  title: string;
  discountLabel: string;
  collectionName: string | null;
  endAt: string;
  href: string;
}) {
  const [expired, setExpired] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Slight delay so page renders first, then popup slides in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (expired || dismissed) return null;

  const discountMatch = discountLabel.match(/(\d+)(%|₹\d+)?/);
  const bigNumber = discountMatch ? discountMatch[1] : "";
  const isPercent = discountLabel.includes("%");

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 350);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"
          }`}
      >
        <div
          className={`relative pointer-events-auto w-full max-w-lg bg-[#F5EFE6] shadow-2xl transition-all duration-300 ease-out ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top gold bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#7A0B2E] via-[#CE9222] to-[#7A0B2E]" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-[#2D1F2F]/40 hover:text-[#2D1F2F] hover:bg-[#2D1F2F]/5 transition-colors rounded-full"
            aria-label="Close"
          >
            <i className="ri-close-line text-xl" />
          </button>

          {/* Content */}
          <div className="relative overflow-hidden">
            {/* Ghost watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              <div className="flex items-baseline leading-none">
                <span
                  className="font-black text-[#2D1F2F]/[0.05] tracking-tighter"
                  style={{ fontSize: "clamp(100px, 28vw, 180px)", lineHeight: 1 }}
                >
                  {bigNumber}
                </span>
                {isPercent && (
                  <span
                    className="font-black text-[#2D1F2F]/[0.05]"
                    style={{ fontSize: "clamp(44px, 11vw, 72px)", lineHeight: 1 }}
                  >
                    %
                  </span>
                )}
              </div>
            </div>

            <div className="relative z-10 px-8 pt-8 pb-6 flex flex-col items-center text-center">
              {/* Flash badge */}
              <div className="flex items-center gap-2 bg-[#7A0B2E]/15 border border-[#7A0B2E]/30 px-4 py-1.5 mb-5">
                <i className="ri-flashlight-fill text-[#7A0B2E] text-sm" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7A0B2E]">
                  Limited Time Offer
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-3xl md:text-4xl text-[#2D1F2F] tracking-wide mb-1">
                {title}
              </h2>
              <p className="text-xs text-[#2D1F2F]/60 mb-6">
                {collectionName ? `On all ${collectionName}` : "Storewide — all collections"}
              </p>

              {/* Big discount */}
              <div className="bg-[#2D1F2F] px-10 py-5 mb-6 text-center relative">
                <div className="absolute top-0 left-0 w-0 h-0 border-r-[20px] border-r-transparent border-t-[20px] border-t-[#7A0B2E]" />
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#7A0B2E] mb-0.5">Get</p>
                <div className="flex items-baseline gap-1 justify-center">
                  <span
                    className="font-black text-white"
                    style={{ fontSize: "clamp(52px, 12vw, 80px)", lineHeight: 1 }}
                  >
                    {bigNumber}
                  </span>
                  <span
                    className="font-black text-[#7A0B2E]"
                    style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: 1 }}
                  >
                    {isPercent ? "%" : "₹"}
                  </span>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/60 mt-1">
                  Off Everything
                </p>
              </div>

              {/* Countdown */}
              <div className="mb-6 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">Ends in</p>
                <CountdownTimer endAt={endAt} onExpire={() => setExpired(true)} />
              </div>

              {/* CTA */}
              <Link
                href={href}
                onClick={handleDismiss}
                className="w-full flex items-center justify-center gap-2 bg-[#2D1F2F] hover:bg-[#7A0B2E] text-white py-3.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 group mb-3"
              >
                Shop the Sale
                <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={handleDismiss}
                className="text-[9px] font-bold uppercase tracking-widest text-[#2D1F2F]/40 hover:text-[#2D1F2F] transition-colors"
              >
                No thanks, continue browsing
              </button>
            </div>
          </div>

          {/* Bottom gold bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#7A0B2E] via-[#CE9222] to-[#7A0B2E]" />
        </div>
      </div>
    </>
  );
}
