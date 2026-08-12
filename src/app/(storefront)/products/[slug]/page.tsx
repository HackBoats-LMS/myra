import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import ImageGallery from "@/components/storefront/ImageGallery";
import ProductCard from "@/components/storefront/ProductCard";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StarRating from "@/components/storefront/StarRating";
import ReviewSection from "@/components/storefront/ReviewSection";
import RecentlyViewed from "@/components/storefront/RecentlyViewed";
import { getCachedReviews, getCachedRelatedProducts } from "@/lib/cache";

export const revalidate = 3600; // 1 hour ISR

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
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
    where: { slug },
    include: { collection: true, variants: true },
  });

  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const currentUserId = session?.user?.id || null;

  // Parallel fetch: reviews, related products, and user purchase status
  const [reviews, related, purchase] = await Promise.all([
    getCachedReviews(product.id),
    getCachedRelatedProducts(product.id, product.collectionId),
    currentUserId
      ? prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: {
              userId: currentUserId,
              status: { not: "CANCELLED" }
            }
          }
        })
      : Promise.resolve(null),
  ]);

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  // Find logged-in user's review if any
  const userReview = currentUserId 
    ? reviews.find(r => r.userId === currentUserId) || null
    : null;

  const hasPurchased = !!purchase;

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
      price: product.price,
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
        datePublished: r.createdAt?.toISOString(),
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Image Gallery */}
          <ImageGallery images={product.images} alt={product.name} />

          {/* Product Info */}
          <div className="flex flex-col pt-2 md:pt-4">
            
            <h1 className="text-2xl md:text-3xl font-serif text-[#4A3B2C] tracking-wide mb-6">
              {product.name}
            </h1>

            {/* Price Block */}
            <div className="flex items-end gap-3 mb-8">
              <span className="text-xl font-bold text-[#4A3B2C]">Rs. {product.price.toLocaleString('en-IN')}</span>
              {/* Simulated original price and discount */}
              <span className="text-sm text-gray-400 line-through">Rs. {Math.round(product.price * 1.25).toLocaleString('en-IN')}</span>
              <span className="text-xs font-bold text-green-600 mb-0.5 tracking-wider">20%</span>
            </div>

            <AddToCartButton 
              productId={product.id} 
              outOfStock={product.stockQuantity <= 0} 
              variants={product.variants} 
            />

            {/* Product Specifications */}
            <div className="mt-8 space-y-2 border-t border-gray-100 pt-6">
              <div className="grid grid-cols-[120px_1fr] text-xs">
                <span className="font-bold text-[#4A3B2C]">Product Type:</span>
                <span className="text-gray-600">Anarkali Suit Set (3 Piece)</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] text-xs">
                <span className="font-bold text-[#4A3B2C]">Fabric:</span>
                <span className="text-gray-600">Pure Silk Blend</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] text-xs">
                <span className="font-bold text-[#4A3B2C]">Pattern:</span>
                <span className="text-gray-600">Chevron Zigzag with Gotta Patti & Mirror Work</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] text-xs">
                <span className="font-bold text-[#4A3B2C]">Bottom Wear:</span>
                <span className="text-gray-600">Matching Orange Palazzo Pants</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] text-xs">
                <span className="font-bold text-[#4A3B2C]">Dupatta:</span>
                <span className="text-gray-600">Yes</span>
              </div>
            </div>

            {/* Shipping Check */}
            <div className="mt-8">
              <h3 className="font-bold text-[#4A3B2C] text-sm mb-3">Shipping</h3>
              <div className="flex items-center gap-2 max-w-[200px]">
                <div className="flex items-center border border-gray-200 rounded-sm w-full bg-white px-3 py-2 text-xs">
                  <span className="text-gray-400 mr-2">🚚</span>
                  <input type="text" placeholder="Check your pincode..." className="w-full bg-transparent outline-none text-gray-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        <section className="mt-16 border-t border-[#B6925B]/20 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-serif text-[#4A3B2C]">Ratings & reviews:</h2>
          </div>
          
          <div className="flex items-center gap-2 mb-10">
            <StarRating rating={averageRating || 4} sizeClassName="w-5 h-5 text-[#B6925B]" />
            <span className="text-xl text-[#4A3B2C] ml-2">
              {(averageRating || 4).toFixed(1)} out of 5
            </span>
          </div>

          <ReviewSection 
            productId={product.id} 
            reviews={reviews} 
            isLoggedIn={isLoggedIn} 
            userReview={userReview}
            hasPurchased={hasPurchased} 
          />
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
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}