import Link from "next/link";
import ProductCarousel from "./ProductCarousel";
import SectionHeading from "./SectionHeading";
import type { Prisma } from "@/generated/prisma";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { collection: true; reviews: true };
}>;

interface NewArrivalsSectionProps {
  products: ProductWithRelations[];
}

export default function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-16">
      <SectionHeading title="New Arrivals" />
      <ProductCarousel products={products} />
      <div className="flex justify-center mt-8 md:mt-12">
        <Link href="/collections/new-arrivals" className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
          View All
        </Link>
      </div>
    </section>
  );
}
