import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/storefront/Pagination";
import FilterControls from "@/components/storefront/FilterControls";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!collection) return {};
  return {
    title: `${collection.name} | Myra Shopping Mall`,
    description: collection.description || `Shop the ${collection.name} collection at Myra Shopping Mall.`,
    openGraph: {
      title: `${collection.name} | Myra Shopping Mall`,
      description: collection.description || `Shop the ${collection.name} collection at Myra Shopping Mall.`,
      type: "website",
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; stock?: string; priceRange?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));
  const ITEMS_PER_PAGE = 8;

  const sort = resolvedSearchParams.sort || 'newest';
  const stock = resolvedSearchParams.stock || 'all';
  const priceRange = resolvedSearchParams.priceRange || 'all';

  // Construct filters
  const whereClause: any = {
    collection: { slug }
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
  let orderByClause: any = { createdAt: 'desc' };
  if (sort === 'price-asc') {
    orderByClause = { price: 'asc' };
  } else if (sort === 'price-desc') {
    orderByClause = { price: 'desc' };
  } else if (sort === 'name-asc') {
    orderByClause = { name: 'asc' };
  }

  const [collection, products, totalProducts] = await Promise.all([
    prisma.collection.findUnique({
      where: { slug }
    }),
    prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { reviews: true }
    }),
    prisma.product.count({
      where: whereClause
    })
  ]);

  if (!collection) {
    notFound();
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  
  // Construct baseUrl preserving other query params
  const queryParams = new URLSearchParams();
  if (sort !== 'newest') queryParams.set('sort', sort);
  if (stock !== 'all') queryParams.set('stock', stock);
  if (priceRange !== 'all') queryParams.set('priceRange', priceRange);
  const queryString = queryParams.toString();
  const baseUrl = `/collections/${slug}${queryString ? `?${queryString}` : ''}`;

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight capitalize">{collection.name}</h1>
        {collection.description && (
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">{collection.description}</p>
        )}
      </div>

      {/* Filter and Sorting Controls */}
      <FilterControls />

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-20 border border-dashed border-gray-200 rounded-lg">
          No products match the selected filters.
        </div>
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
