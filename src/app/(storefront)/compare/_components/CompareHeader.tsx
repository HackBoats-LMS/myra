import Link from "next/link";

export default function CompareHeader() {
  return (
    <div className="flex items-center justify-between mb-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mb-1 flex items-center gap-1.5">
          <i className="ri-arrow-left-right-line" />
          Side by Side
        </p>
        <h1 className="text-2xl md:text-3xl font-serif text-[#4A3B2C] tracking-wide">Compare Products</h1>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors border border-[#B6925B]/30 px-4 py-2 hover:bg-white"
      >
        <i className="ri-store-2-line" />
        <span className="hidden sm:inline">Continue Shopping</span>
      </Link>
    </div>
  );
}
