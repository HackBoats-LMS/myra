import Link from "next/link";
import ProductCarousel from "./ProductCarousel";
import SectionHeading from "./SectionHeading";
import type { Prisma } from "@/generated/prisma";

type ProductWithRelations = any;

interface BestSellersSectionProps {
  products: ProductWithRelations[];
}

export default function BestSellersSection({ products }: BestSellersSectionProps) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-16">
      <SectionHeading title="Best Sellers" />
      <ProductCarousel products={products} />
      <div className="flex justify-center mt-8 md:mt-12">
        <Link href="/collections/best-sellers" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
          View All
        </Link>
      </div>
    </section>
  );
}
