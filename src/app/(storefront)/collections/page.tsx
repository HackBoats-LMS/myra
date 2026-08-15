import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/storefront/Pagination";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

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
  const ITEMS_PER_PAGE = 8;

  const sort = resolvedSearchParams.sort || 'newest';
  const stock = resolvedSearchParams.stock || 'all';
  const priceRange = resolvedSearchParams.priceRange || 'all';

  const whereClause: Prisma.ProductWhereInput = { deletedAt: null };

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
      include: { reviews: { select: { rating: true } } }
    }),
    prisma.product.count({
      where: whereClause
    })
  ]);

  // Compute review data for each product
  const productsWithReviews = products.map(({ reviews, ...product }) => {
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
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">All Products</h1>
          <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold">Explore our entire collection</p>
        </div>

        {productsWithReviews.length === 0 ? (
          <div className="text-center text-[#B6925B] text-[10px] uppercase tracking-widest font-bold py-10 md:py-10 md:py-20">No products available at the moment.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {productsWithReviews.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-12">
              <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}