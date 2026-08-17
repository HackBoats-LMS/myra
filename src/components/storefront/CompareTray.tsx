"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCompareProducts, type CompareProduct } from "@/actions/compare";

export default function CompareTray({
  compareIds,
  onClear,
}: {
  compareIds: string[];
  onClear: () => Promise<void>;
}) {
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let active = true;
    if (compareIds.length > 0) {
      getCompareProducts(compareIds).then((data) => {
        if (active) setProducts(data);
      });
    } else {
      queueMicrotask(() => setProducts([]));
    }
    return () => {
      active = false;
    };
  }, [compareIds]);

  if (compareIds.length === 0) return null;

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClear();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        {/* Expanded product tray */}
        <div
          className={`bg-white border-t-2 border-[#B6925B]/40 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out ${
            open ? "max-h-[240px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            {/* Products in tray */}
            <div className="flex items-start gap-4 overflow-x-auto pb-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 shrink-0 bg-[#FAFAFA] border border-[#B6925B]/20 p-3 min-w-[200px] max-w-[240px]"
                >
                  <div className="relative w-12 h-16 flex-shrink-0 border border-[#B6925B]/20 overflow-hidden bg-white">
                    {p.image && (
                      <Image src={p.image} alt={p.name} fill quality={80} className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#4A3B2C] line-clamp-2 leading-snug">{p.name}</p>
                    <p className="text-[10px] text-[#B6925B] font-black mt-1">
                      ₹{p.price?.toLocaleString("en-IN") ?? "—"}
                    </p>
                  </div>
                </div>
              ))}

              {/* Placeholder slots up to 4 */}
              {Array.from({ length: Math.max(0, 2 - products.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center shrink-0 bg-[#FAFAFA] border border-dashed border-[#B6925B]/30 p-3 min-w-[200px] h-[88px]"
                >
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                    + Add a product
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#4A3B2C] border-t border-[#B6925B]/20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
            {/* Left — toggle & count */}
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2.5 text-white hover:text-[#B6925B] transition-colors group"
            >
              <i className="ri-arrow-left-right-line text-base text-[#B6925B]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Compare
              </span>
              <span className="bg-[#B6925B] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {compareIds.length}
              </span>
              <i
                className={`ri-arrow-${open ? "down" : "up"}-s-line text-sm text-white/60 group-hover:text-[#B6925B] transition-all`}
              />
            </button>

            {/* Right — actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                {clearing ? <i className="ri-loader-4-line animate-spin" /> : "Clear All"}
              </button>
              <div className="w-px h-4 bg-white/20" />
              <Link
                href="/compare"
                className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors flex items-center gap-2"
              >
                <i className="ri-arrow-left-right-line text-sm" />
                Compare Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}