import { prisma } from "@/lib/db/prisma";
import { getCompareIds } from "@/lib/compare";
import Link from "next/link";
import { Metadata } from "next";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import CompareEmptyState from "@/app/(storefront)/compare/_components/CompareEmptyState";
import CompareHeader from "@/app/(storefront)/compare/_components/CompareHeader";
import CompareTable from "@/app/(storefront)/compare/_components/CompareTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Products | Myra Shopping Mall",
  description: "Compare products side by side to make the best choice.",
};

export default async function ComparePage() {
  const ids = await getCompareIds();

  if (ids.length === 0) return <CompareEmptyState />;

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: {
      reviews: { select: { rating: true } },
      variants: true,
    },
  });

  if (products.length === 0) return <CompareEmptyState />;

  const ordered = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const flashSales = await getActiveFlashSales();
  const priced = applyFlashToProductList(ordered, flashSales);

  return (
    <div className="w-full bg-[#F5EFE6] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        
        {/* Page header */}
        <CompareHeader />

        {/* Compare table */}
        <CompareTable ordered={ordered} priced={priced} />

        {/* Bottom CTA */}
        <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
          <p>Showing {ordered.length} product{ordered.length !== 1 ? "s" : ""} in comparison</p>
          <Link href="/" className="text-[#7A0B2E] hover:text-[#2D1F2F] font-bold uppercase tracking-widest transition-colors text-[10px]">
            + Add more products
          </Link>
        </div>

      </div>
    </div>
  );
}
