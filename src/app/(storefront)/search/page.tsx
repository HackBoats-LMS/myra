import { prisma } from "@/lib/db/prisma";
import ProductCard from "@/components/shared/ProductCard";
import Pagination from "@/components/shared/Pagination";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";

export const metadata: Metadata = {
  title: "Search Results | Myra Shopping Mall",
  description: "Browse products matching your search query at Myra Shopping Mall.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; stock?: string; priceRange?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = (resolvedSearchParams.q || "").trim();
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const ITEMS_PER_PAGE = 12;

  const sort = resolvedSearchParams.sort || 'newest';
  const stock = resolvedSearchParams.stock || 'all';
  const priceRange = resolvedSearchParams.priceRange || 'all';

  if (!query) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 min-h-[60vh] text-center bg-white">
        <h1 className="text-3xl md:text-4xl font-serif text-[#333333] font-normal tracking-tight mb-4">
          Search Our Catalog
        </h1>
        <p className="text-xs md:text-sm text-gray-500 font-serif">
          Enter a keyword or product name in the search bar above.
        </p>
      </div>
    );
  }

  // Construct filters
  const whereClause: Prisma.ProductWhereInput = {
    deletedAt: null,
    OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
    ],
  };

  if (stock === 'instock') {
    whereClause.stockQuantity = { gt: 0 };
  }

  if (priceRange === 'under-1000') {
    whereClause.price = { lt: 1000 };
  } else if (priceRange === '1000-5000') {
    whereClause.price = { gte: 1000, lte: 5000 };
  } else if (priceRange === 'over-5000') {
    whereClause.price = { gt: 5000 };
  }

  // Construct order
  let orderByClause: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'price-asc') {
    orderByClause = { price: 'asc' };
  } else if (sort === 'price-desc') {
    orderByClause = { price: 'desc' };
  } else if (sort === 'name-asc') {
    orderByClause = { name: 'asc' };
  }

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { collection: true, reviews: { select: { rating: true } } },
    }),
    prisma.product.count({
      where: whereClause,
    }),
  ]);

  // Compute review data for each product
  const sales = await getActiveFlashSales();
  const productsWithReviews = applyFlashToProductList(products, sales).map(({ reviews, ...product }) => {
    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    return { ...product, reviewCount, averageRating };
  });

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  
  const queryParams = new URLSearchParams();
  queryParams.set('q', query);
  if (sort !== 'newest') queryParams.set('sort', sort);
  if (stock !== 'all') queryParams.set('stock', stock);
  if (priceRange !== 'all') queryParams.set('priceRange', priceRange);
  const queryString = queryParams.toString();
  const baseUrl = `/search?${queryString}`;

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-serif text-[#333333] font-normal tracking-tight">
            Search Results
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-2 font-serif">
            Showing {productsWithReviews.length} of {totalProducts} results for &ldquo;
            <span className="font-semibold text-[#4A3B2C]">{query}</span>&rdquo;
          </p>
        </div>

        {productsWithReviews.length === 0 ? (
          <div className="text-center text-[#B6925B] text-xs uppercase tracking-widest font-semibold py-16 md:py-24 border border-dashed border-[#B6925B]/20 bg-[#FAF8F5]">
            No products match your search query. Try another term.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {productsWithReviews.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-16">
                <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
