import { prisma } from "@/lib/db/prisma";
import ProductCard from "@/components/shared/ProductCard";
import Pagination from "@/components/shared/Pagination";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";
import { getCachedFilteredProducts } from "@/lib/cache";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({ 
    where: { slug }, 
    select: { name: true, description: true, image: true } 
  });
  if (!collection) return {};
  return {
    title: `${collection.name} | Myra Shopping Mall`,
    description: collection.description || `Shop the ${collection.name} collection at Myra Shopping Mall.`,
    openGraph: {
      title: `${collection.name} | Myra Shopping Mall`,
      description: collection.description || `Shop the ${collection.name} collection at Myra Shopping Mall.`,
      type: "website",
      images: collection.image ? [{ url: collection.image }] : undefined,
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
  const ITEMS_PER_PAGE = 12;

  const sort = resolvedSearchParams.sort || 'newest';
  const stock = resolvedSearchParams.stock || 'all';
  const priceRange = resolvedSearchParams.priceRange || 'all';

  // 1. Fetch collection along with child subcategories and parent
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      children: {
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } }
        },
        orderBy: [{ order: "asc" }, { name: "asc" }]
      },
      parent: {
        include: {
          children: {
            include: {
              _count: { select: { products: { where: { deletedAt: null } } } }
            },
            orderBy: [{ order: "asc" }, { name: "asc" }]
          }
        }
      }
    }
  });

  if (!collection) {
    notFound();
  }

  const isMainCategory = !collection.parentId;

  // 2. Product Query Filter:
  // If it's a Main Category -> Aggregate products from this category AND all its subcategories
  // If it's a Subcategory -> Exclusively query products of this specific subcategory!
  const targetCollectionIds = isMainCategory
    ? [collection.id, ...collection.children.map(c => c.id)]
    : [collection.id];

  const specialFilter = slug === "best-sellers" ? "best-sellers" : slug === "new-arrivals" ? "new-arrivals" : undefined;

  const [{ products, totalProducts }, flashSales] = await Promise.all([
    getCachedFilteredProducts(
      targetCollectionIds,
      stock,
      priceRange,
      sort,
      currentPage,
      ITEMS_PER_PAGE,
      specialFilter
    ),
    getActiveFlashSales()
  ]);

  const productsWithReviews = applyFlashToProductList(products, flashSales).map(({ reviews, ...product }) => {
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
  const baseUrl = `/collections/${slug}${queryString ? `?${queryString}` : ''}`;

  // Default luxury banners for main categories if admin has not uploaded a custom one yet
  const DEFAULT_BANNERS: Record<string, string> = {
    women: "/displaypics/women-banner.jpg",
    sarees: "/displaypics/sarees-banner.jpg",
    bridal: "/displaypics/bridal-banner.jpg",
    kids: "/displaypics/kids-banner.jpg",
  };

  const defaultBanner = DEFAULT_BANNERS[slug.toLowerCase()] || (collection.parent ? DEFAULT_BANNERS[collection.parent.slug.toLowerCase()] : undefined);

  // Banners for this category (Admin custom upload takes top priority)
  const allBanners = collection.banners && collection.banners.length > 0
    ? collection.banners
    : collection.image
    ? [collection.image]
    : defaultBanner
    ? [defaultBanner]
    : [];

  const mainCategorySlug = isMainCategory ? collection.slug : collection.parent?.slug;
  const mainCategoryName = isMainCategory ? collection.name : collection.parent?.name;
  const subcategoryList = isMainCategory ? collection.children : collection.parent?.children || [];

  return (
    <div className="w-full bg-white min-h-screen">
      {/* 1. Breadcrumb Navigation */}
      <div className="border-b border-[#7A0B2E]/15 bg-[#F5EFE6]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs font-serif lowercase text-gray-500">
            <Link href="/" className="hover:text-[#7A0B2E] transition-colors">home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            {collection.parent && (
              <>
                <Link href={`/collections/${collection.parent.slug}`} className="hover:text-[#7A0B2E] transition-colors">
                  {collection.parent.name.toLowerCase()}
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </>
            )}
            <span className="text-[#2D1F2F] font-semibold">{collection.name.toLowerCase()}</span>
          </nav>
        </div>
      </div>

      {/* 2. Custom Category Banners Section */}
      {allBanners.length > 0 ? (
        <div className="w-full">
          {/* Main Hero Banner */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[560px] bg-[#111111] overflow-hidden">
            <Image
              src={allBanners[0]}
              alt={collection.name}
              fill
              priority
              sizes="100vw"
              className="object-cover object-top sm:object-[center_12%] opacity-90"
            />
            {/* Elegant Luxury Gradient Overlay with Lower-Third Title Placement */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end justify-center pb-8 sm:pb-12 md:pb-16">
              <div className="text-center px-4 max-w-3xl">
                <span className="text-[10px] sm:text-xs text-[#F3E8E8] uppercase tracking-[0.25em] font-bold block mb-2 drop-shadow">
                  {isMainCategory ? "Exclusive Collection" : `Category / ${collection.parent?.name || "Collection"}`}
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight drop-shadow-md capitalize">
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-xs sm:text-sm md:text-base text-gray-200 mt-2 font-serif max-w-xl mx-auto drop-shadow leading-relaxed">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Promotional Banners Grid (if admin uploaded multiple custom banners) */}
          {allBanners.length > 1 && (
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allBanners.slice(1).map((bannerUrl, idx) => (
                  <div 
                    key={idx} 
                    className="relative h-40 sm:h-48 md:h-56 rounded-none overflow-hidden border border-[#7A0B2E]/30 shadow-md group"
                  >
                    <Image
                      src={bannerUrl}
                      alt={`${collection.name} promo banner ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-b border-[#7A0B2E]/15 bg-[#F5EFE6] py-10 md:py-16">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 text-center">
            <span className="text-[10px] text-[#7A0B2E] uppercase tracking-[0.2em] font-bold block mb-1">
              {isMainCategory ? "Collection" : `Category / ${collection.parent?.name || ""}`}
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#333333] tracking-tight capitalize">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-xs md:text-sm text-gray-500 max-w-xl mx-auto mt-2.5 font-serif">
                {collection.description}
              </p>
            )}
            <div className="w-16 h-0.5 bg-[#7A0B2E]/40 mx-auto mt-4" />
          </div>
        </div>
      )}

      {/* 3. Visual Subcategory Cards (When viewing a Main Category that has Subcategories) */}
      {isMainCategory && collection.children.length > 0 && (
        <section className="border-b border-[#7A0B2E]/15 bg-white py-10 md:py-14">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#2D1F2F] tracking-wide">
                  Explore {collection.name} Categories
                </h2>
                <p className="text-xs text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">
                  Choose a category below to browse specific designs
                </p>
              </div>
            </div>

            {/* Subcategory Visual Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {collection.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/collections/${child.slug}`}
                  className="group relative flex flex-col bg-[#F5EFE6] border border-[#7A0B2E]/20 hover:border-[#7A0B2E] transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden"
                >
                  {/* Thumbnail / Image container */}
                  <div className="relative aspect-[3/4] w-full bg-[#FAF0F2] overflow-hidden">
                    {child.image ? (
                      <Image
                        src={child.image}
                        alt={child.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#F5EFE6] to-[#FAF0F2]">
                        <Sparkles className="w-8 h-8 text-[#7A0B2E]/40 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-serif text-sm font-bold text-[#2D1F2F]">
                          {child.name}
                        </span>
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 border border-[#7A0B2E]/30 text-[10px] font-bold text-[#7A0B2E] uppercase tracking-wider">
                      {child._count.products} Styles
                    </div>
                  </div>

                  {/* Card Title & Link footer */}
                  <div className="p-3.5 flex items-center justify-between bg-white border-t border-[#7A0B2E]/10">
                    <span className="font-serif text-sm sm:text-base font-bold text-[#2D1F2F] group-hover:text-[#7A0B2E] transition-colors line-clamp-1">
                      {child.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#7A0B2E] transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Subcategory Quick Pill Buttons Bar */}
      {subcategoryList.length > 0 && (
        <div className="sticky top-0 z-30 bg-[#F5EFE6]/95 backdrop-blur-md border-b border-[#7A0B2E]/20 py-3.5 px-4 shadow-xs">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#2D1F2F] whitespace-nowrap">
              {isMainCategory ? "Filter By Subcategory:" : `More in ${mainCategoryName}:`}
            </span>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {/* "All" Button */}
              {mainCategorySlug && (
                <Link
                  href={`/collections/${mainCategorySlug}`}
                  className={`px-4 py-1.5 text-xs font-serif whitespace-nowrap transition-all border ${
                    slug === mainCategorySlug
                      ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm font-semibold"
                      : "bg-white text-[#2D1F2F] border-[#7A0B2E]/30 hover:border-[#7A0B2E] hover:text-[#7A0B2E]"
                  }`}
                >
                  All {mainCategoryName}
                </Link>
              )}

              {/* Subcategory Buttons */}
              {subcategoryList.map((sub) => {
                const isActive = slug === sub.slug;
                return (
                  <Link
                    key={sub.id}
                    href={`/collections/${sub.slug}`}
                    className={`px-4 py-1.5 text-xs font-serif whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-[#7A0B2E] text-white border-[#7A0B2E] shadow-sm font-semibold"
                        : "bg-white text-[#2D1F2F] border-[#7A0B2E]/30 hover:border-[#7A0B2E] hover:text-[#7A0B2E]"
                    }`}
                  >
                    {sub.name}
                    {sub._count?.products !== undefined && sub._count.products > 0 && (
                      <span className={`ml-1.5 text-[10px] ${isActive ? "text-white/80" : "text-gray-400"}`}>
                        ({sub._count.products})
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Products Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#7A0B2E]/10">
          <div>
            <span className="text-xs uppercase tracking-widest font-serif text-gray-500">
              Showing <strong className="text-[#2D1F2F]">{totalProducts}</strong> products
              {!isMainCategory && <span className="text-[#7A0B2E] ml-1">in {collection.name}</span>}
            </span>
          </div>
        </div>

        {productsWithReviews.length === 0 ? (
          <div className="text-center text-[#7A0B2E] text-xs uppercase tracking-widest font-semibold py-16 md:py-24 border border-dashed border-[#7A0B2E]/20 bg-[#F5EFE6]">
            No products found in this category yet.
          </div>
        ) : (
          <>
            {/* 4-Column Product Grid */}
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