import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/storefront/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products | Myra Shopping Mall",
  description: "Browse our complete collection of curated products at Myra Shopping Mall.",
  openGraph: {
    title: "All Products | Myra Shopping Mall",
    description: "Browse our complete collection of curated products at Myra Shopping Mall.",
    type: "website",
  },
};

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));
  const ITEMS_PER_PAGE = 8;

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { reviews: true }
    }),
    prisma.product.count()
  ]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const baseUrl = '/collections';

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight">All Products</h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">Explore our entire collection</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No products available at the moment.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-12">
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
          </div>
        </>
      )}
    </div>
  );
}
