import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/storefront/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Results | Myra Shopping Mall",
  description: "Browse products matching your search query at Myra Shopping Mall.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams.q || "").trim();
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const ITEMS_PER_PAGE = 8;

  if (!query) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-24 min-h-screen text-center">
        <h1 className="text-3xl font-serif text-gray-900 mb-4">Search Our Catalog</h1>
        <p className="text-gray-500 mb-8">Enter a search term in the search bar above to browse products.</p>
      </div>
    );
  }

  // Construct filters
  const whereClause = {
    OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
    ],
  };

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { collection: true, reviews: true },
    }),
    prisma.product.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const baseUrl = `/search?q=${encodeURIComponent(query)}`;

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 tracking-tight">
          Search Results
        </h1>
        <p className="text-sm text-gray-500">
          Showing {products.length} of {totalProducts} result(s) for &ldquo;
          <span className="font-semibold text-gray-900">{query}</span>&rdquo;
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-20 border border-dashed border-gray-200 rounded-lg">
          No products match your search query. Try another term!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {products.map((product) => (
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
