import { prisma } from "@/lib/db/prisma";
import ProductCard from "@/components/shared/ProductCard";
import Pagination from "@/components/shared/Pagination";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import { getCachedFilteredProducts } from "@/lib/cache";

export const metadata: Metadata = {
  title: "All Products | Myra Shopping Mall",
  description: "Browse our complete collection of curated products at Myra Shopping Mall.",
  openGraph: {
    title: "All Products | Myra Shopping Mall",
    description: "Browse our complete collection of curated products at Myra Shopping Mall.",
    type: "website",
  },
};

export const revalidate = 3600;

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; stock?: string; priceRange?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));
  const ITEMS_PER_PAGE = 12;

  const sort = resolvedSearchParams.sort || 'newest';
  const stock = resolvedSearchParams.stock || 'all';
  const priceRange = resolvedSearchParams.priceRange || 'all';

  const { products, totalProducts } = await getCachedFilteredProducts(
    null, // No specific collection IDs for the "All Products" page
    stock,
    priceRange,
    sort,
    currentPage,
    ITEMS_PER_PAGE
  );

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
  if (sort !== 'newest') queryParams.set('sort', sort);
  if (stock !== 'all') queryParams.set('stock', stock);
  if (priceRange !== 'all') queryParams.set('priceRange', priceRange);
  const queryString = queryParams.toString();
  const baseUrl = `/collections${queryString ? `?${queryString}` : ''}`;

  return (
    <div className="w-full bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-serif text-[#333333] font-normal tracking-tight">
            All Products
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto mt-2 font-serif">
            Explore our entire collection of curated premium items
          </p>
        </div>

        {productsWithReviews.length === 0 ? (
          <div className="text-center text-[#7A0B2E] text-xs uppercase tracking-widest font-semibold py-16 md:py-24 border border-dashed border-[#7A0B2E]/20 bg-[#FAFAFA]">
            No products available at the moment.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {productsWithReviews.map(product => (
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
