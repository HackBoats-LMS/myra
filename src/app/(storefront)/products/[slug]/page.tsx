import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ImageGallery from "@/app/(storefront)/products/[slug]/_components/ImageGallery";
import RecentlyViewedRail from "@/app/(storefront)/products/[slug]/_components/RecentlyViewedRail";
import RecentlyViewedTracker from "@/app/(storefront)/products/[slug]/_components/RecentlyViewedTracker";
import ProductInfo from "@/app/(storefront)/products/[slug]/_components/ProductInfo";
import ProductReviews from "@/app/(storefront)/products/[slug]/_components/ProductReviews";
import SimilarProducts from "@/app/(storefront)/products/[slug]/_components/SimilarProducts";
import ProductVideoEmbed from "@/app/(storefront)/products/[slug]/_components/ProductVideoEmbed";
import { getActiveFlashSales, applyFlashDiscount, applyFlashToProductList } from "@/lib/flash-sale";
import { getCachedReviews, getCachedRelatedProducts } from "@/lib/cache";

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\>/g, "\\u003e").replace(/<\//g, "\\u003c/");
}

export const revalidate = 3600; // 1 hour ISR

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    select: { name: true, description: true, images: true },
  });
  if (!product) return {};
  return {
    title: `${product.name} | Myra Shopping Mall`,
    description: product.description?.slice(0, 160) || `Shop ${product.name} at Myra Shopping Mall.`,
    openGraph: {
      title: `${product.name} | Myra Shopping Mall`,
      description: product.description?.slice(0, 160) || `Shop ${product.name} at Myra Shopping Mall.`,
      images: product.images[0] ? [product.images[0]] : [],
      type: "website",
    },
  };
}

import ProductBackButton from "@/app/(storefront)/products/[slug]/_components/ProductBackButton";

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch product with collection and variants
  const product = await prisma.product.findUnique({
    where: { slug, deletedAt: null },
    include: { collection: true, variants: true },
  });

  if (!product) notFound();

  // Parallel fetch: reviews, related products, and active flash sales
  const [reviews, related, flashSales] = await Promise.all([
    getCachedReviews(product.id),
    getCachedRelatedProducts(product.id, product.collectionId),
    getActiveFlashSales(),
  ]);

  const flashPricing = applyFlashDiscount(product.price, product.originalPrice, flashSales, product.collectionId);
  const displayPrice = flashPricing.price;
  const displayOriginal = flashPricing.originalPrice;
  const flashPercent = flashPricing.percent > 0 ? flashPricing.percent : null;

  const relatedWithPricing = applyFlashToProductList(related, flashSales);

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
      ...(product.collection
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.collection.name,
              item: `${appUrl}/collections/${product.collection.slug}`,
            },
          ]
        : []),
      { "@type": "ListItem", position: product.collection ? 3 : 2, name: product.name, item: `${appUrl}/products/${product.slug}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      url: `${appUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: displayPrice,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stockQuantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviewCount,
      }
    }),
    ...(reviews.length > 0 && {
      review: reviews.slice(0, 10).map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
        },
        author: {
          "@type": "Person",
          name: r.user?.name || "Verified Customer",
        },
        description: r.comment || undefined,
        datePublished: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-10 min-h-screen">
        {/* Back Navigation Arrow */}
        <div className="mb-2">
          <ProductBackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Image Gallery & Video */}
          <div className="lg:col-span-7">
            <ImageGallery images={product.images} alt={product.name} />
            {product.videoUrl && (
              <ProductVideoEmbed url={product.videoUrl} />
            )}
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5">
            <ProductInfo 
              product={product} 
              displayPrice={displayPrice} 
              displayOriginal={displayOriginal} 
              flashPercent={flashPercent} 
            />
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        <ProductReviews 
          reviews={reviews} 
          reviewCount={reviewCount} 
          averageRating={averageRating} 
        />

        {/* Similar Products */}
        <SimilarProducts products={relatedWithPricing} />

        {/* Recently Viewed */}
        <RecentlyViewedRail currentProductId={product.id} />
      </div>

      <RecentlyViewedTracker productId={product.id} />
    </>
  );
}