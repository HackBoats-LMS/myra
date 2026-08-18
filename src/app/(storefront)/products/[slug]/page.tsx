import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import ShareProductButton from "@/components/storefront/ShareProductButton";
import CompareButton from "@/components/storefront/CompareButton";
import ImageGallery from "@/components/storefront/ImageGallery";
import ProductCard from "@/components/storefront/ProductCard";
import StarRating from "@/components/storefront/StarRating";
import ReviewSection from "@/components/storefront/ReviewSection";
import PincodeChecker from "@/components/storefront/PincodeChecker";
import RecentlyViewedRail from "@/components/storefront/RecentlyViewedRail";
import RecentlyViewedTracker from "@/components/storefront/RecentlyViewedTracker";
import StockNotifyButton from "@/components/storefront/StockNotifyButton";
import { getActiveFlashSales, applyFlashDiscount, applyFlashToProductList } from "@/lib/flash-sale";
import { getCachedReviews, getCachedRelatedProducts } from "@/lib/cache";

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Image Gallery */}
          <ImageGallery images={product.images} alt={product.name} />

          {product.videoUrl && (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mb-2">Product Video</p>
              <VideoEmbed url={product.videoUrl} />
            </div>
          )}

          {/* Product Info */}
          <div className="flex flex-col pt-2 md:pt-4 lg:sticky lg:top-8 lg:self-start">
            
            <h1 className="text-2xl md:text-3xl font-serif text-[#4A3B2C] tracking-wide mb-4">
              {product.name}
            </h1>

            {product.productType && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#FAFAFA] border border-[#B6925B]/30 text-[#B6925B]">
                  {product.productType}
                </span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-8 break-words">
                {product.description}
              </p>
            )}

            {/* Price Block */}
            <div className="flex items-center gap-3 mb-4">
              {flashPercent && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#B6925B] px-2 py-1">
                  Flash {flashPercent}% OFF
                </span>
              )}
              {displayOriginal != null && displayOriginal > displayPrice && (
                <span className="text-lg text-gray-400 line-through">₹{displayOriginal.toLocaleString('en-IN')}</span>
              )}
              <span className="text-2xl font-bold text-[#4A3B2C]">₹{displayPrice.toLocaleString('en-IN')}</span>
            </div>

            {/* Product Specifications */}
            <div className="space-y-2.5 pt-6 mb-6">
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Product Code:</span>
                <span className="text-gray-600">{product.code || "—"}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Product Type:</span>
                <span className="text-gray-600">{product.productType || "—"}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Material:</span>
                <span className="text-gray-600">{product.material || "—"}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Weight:</span>
                <span className="text-gray-600">{product.weight || "—"}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Fabric:</span>
                <span className="text-gray-600">Pure Silk Blend</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Pattern:</span>
                <span className="text-gray-600">Chevron Zigzag with Gotta Patti & Mirror Work</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Bottom Wear:</span>
                <span className="text-gray-600">Matching Orange Palazzo Pants</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
                <span className="font-bold text-[#4A3B2C]">Dupatta:</span>
                <span className="text-gray-600">Yes</span>
              </div>
            </div>

            <AddToCartButton 
              productId={product.id} 
              outOfStock={product.stockQuantity <= 0} 
              variants={product.variants} 
            />

            {product.stockQuantity <= 0 && (
              <div className="mt-4">
                <StockNotifyButton productId={product.id} />
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <ShareProductButton name={product.name} />
              <CompareButton productId={product.id} variant="pill" className="flex-1" />
            </div>

            <div className="mt-6 border-t border-[#B6925B]/20 pt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Delivery Pincode</p>
              <PincodeChecker />
            </div>
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        <section className="mt-16 border-t border-[#B6925B]/20 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xl md:text-2xl font-serif text-[#4A3B2C]">Ratings & reviews:</h2>
          </div>
          
          <div className="flex items-center gap-2 mb-10 flex-wrap">
            {reviewCount > 0 ? (
              <>
                <StarRating rating={averageRating} sizeClassName="w-5 h-5 text-[#B6925B]" />
                <span className="text-xl text-[#4A3B2C] ml-2">
                  {averageRating.toFixed(1)} out of 5
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No reviews yet.</span>
            )}
          </div>

          <ReviewSection reviews={reviews} />
        </section>

        {/* Similar Products */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
              <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
              <h2 className="text-2xl md:text-3xl font-serif text-[#B6925B] tracking-wider">Similar products</h2>
              <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {relatedWithPricing.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewedRail currentProductId={product.id} />
      </div>

      <RecentlyViewedTracker productId={product.id} />
    </>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);

  if (youtubeMatch) {
    return (
      <div className="relative aspect-video overflow-hidden border border-[#B6925B]/20 bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          className="absolute inset-0 w-full h-full"
          title="Product video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video controls className="w-full aspect-video border border-[#B6925B]/20 bg-black object-contain">
      <source src={url} />
      Your browser does not support the video tag.
    </video>
  );
}