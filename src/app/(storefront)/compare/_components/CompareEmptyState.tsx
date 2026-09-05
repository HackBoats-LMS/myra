import Link from "next/link";

export default function CompareEmptyState() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-32 text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-[#F5EFE6] border border-[#7A0B2E]/20 flex items-center justify-center">
        <i className="ri-arrow-left-right-line text-4xl text-[#7A0B2E]" />
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-serif text-[#2D1F2F] tracking-wide">Nothing to Compare</h1>
        <p className="text-gray-500 text-sm mt-2">Add a couple of products to compare them side by side.</p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors"
      >
        <i className="ri-store-2-line" />
        Browse Products
      </Link>
    </div>
  );
}
