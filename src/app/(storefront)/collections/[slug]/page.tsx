import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import Pagination from "@/components/storefront/Pagination";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

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

export const revalidate = 3600;

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
  const whereClause: Prisma.ProductWhereInput = {
    collection: { slug },
    deletedAt: null
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

  const [collection, products, totalProducts, bestSellers] = await Promise.all([
    prisma.collection.findUnique({
      where: { slug }
    }),
    prisma.product.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      include: { reviews: { select: { rating: true } } }
    }),
    prisma.product.count({
      where: whereClause
    }),
    prisma.product.findMany({
      where: { collection: { slug }, deletedAt: null, bestSeller: true },
      include: { reviews: { select: { rating: true } } },
    })
  ]);

  if (!collection) {
    notFound();
  }

  const productsWithReviews = products.map(({ reviews, ...product }) => {
    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    return { ...product, reviewCount, averageRating };
  });

  const bestSellersWithReviews = bestSellers.map(({ reviews, ...product }) => {
    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
    return { ...product, reviewCount, averageRating };
  });

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  
  // Construct baseUrl preserving other query params
  const queryParams = new URLSearchParams();
  if (sort !== 'newest') queryParams.set('sort', sort);
  if (stock !== 'all') queryParams.set('stock', stock);
  if (priceRange !== 'all') queryParams.set('priceRange', priceRange);
  const queryString = queryParams.toString();
  const baseUrl = `/collections/${slug}${queryString ? `?${queryString}` : ''}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const collectionUrl = `${appUrl}/collections/${slug}`;

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${appUrl}/collections` },
      { "@type": "ListItem", position: 3, name: collection.name, item: collectionUrl },
    ],
  };

  const jsonLdCollection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description || undefined,
    url: collectionUrl,
    ...(collection.image && { image: collection.image }),
    numberOfItems: totalProducts,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }} />
      <div className="w-full bg-[#FAFAFA] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
          
          {/* Clean Serif Header */}
          <div className="flex flex-col items-center justify-center text-center mb-10 space-y-4">
            <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide capitalize">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-gray-500 max-w-2xl mx-auto">{collection.description}</p>
            )}
          </div>

          {/* Best Sellers */}
          {bestSellersWithReviews.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
                <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
                <h2 className="text-xl md:text-2xl font-serif text-[#B6925B] tracking-wider">Best Sellers</h2>
                <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {bestSellersWithReviews.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {productsWithReviews.length === 0 ? (
            <div className="text-center text-[#B6925B] text-[10px] uppercase tracking-widest font-bold py-10 md:py-20 border border-dashed border-[#B6925B]/20 bg-white">
              No products match the selected filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-8">
                {productsWithReviews.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-16">
                <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
              </div>
            </>
          )}

          {/* Similar Products (Visual Placeholder block to match screenshot) */}
          <div className="mt-32">
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
              <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
              <h2 className="text-2xl md:text-3xl font-serif text-[#B6925B] tracking-wider">Similar products</h2>
              <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
            </div>
            {/* If we have products, show a slice, otherwise it's just visual */}
            {productsWithReviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {productsWithReviews.slice(0, 4).map(product => (
                  <ProductCard key={product.id + 'sim'} product={product} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}