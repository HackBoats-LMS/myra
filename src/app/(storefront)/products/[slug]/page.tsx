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

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { collection: true },
  });

  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const currentUserId = session?.user?.id || null;

  // Fetch reviews
  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate average rating
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  // Find logged-in user's review if any
  const userReview = currentUserId 
    ? reviews.find(r => r.userId === currentUserId) || null
    : null;

  // Related products: same collection, excluding current; fall back to latest products
  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...(product.collectionId ? { collectionId: product.collectionId } : {}),
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  // If no collection or fewer than 2 related, pad with latest products
  const relatedFinal =
    related.length >= 2
      ? related
      : await prisma.product.findMany({
          where: { id: { not: product.id } },
          take: 4,
          orderBy: { createdAt: "desc" },
        });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

        {/* Image Gallery */}
        <ImageGallery images={product.images} alt={product.name} />

        {/* Product Info */}
        <div className="flex flex-col pt-4 md:pt-12">
          {product.collection && (
            <Link
              href={`/collections/${product.collection.slug}`}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 hover:text-gray-900 transition-colors"
            >
              {product.collection.name}
            </Link>
          )}
          <h1 className="text-3xl md:text-5xl font-serif text-gray-900 tracking-tight mb-4">
            {product.name}
          </h1>

          {/* Average Review Star Rating */}
          <div className="flex items-center gap-2 mb-6">
            <StarRating rating={averageRating} sizeClassName="w-4.5 h-4.5" />
            {reviewCount > 0 ? (
              <span className="text-sm font-medium text-gray-500">
                {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            ) : (
              <span className="text-sm font-medium text-gray-400">No reviews yet</span>
            )}
          </div>

          <p className="text-2xl text-gray-900 mb-8">₹{product.price.toFixed(2)}</p>

          <div className="prose prose-sm text-gray-600 mb-12">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto space-y-4">
            <AddToCartButton productId={product.id} outOfStock={product.stockQuantity <= 0} />
            <div className="text-xs text-center text-gray-500 uppercase tracking-widest">
              Complimentary shipping and returns
            </div>
          </div>
        </div>
      </div>

      {/* Customer Review Section */}
      <section className="mt-24 border-t border-gray-100 pt-16">
        <ReviewSection 
          productId={product.id} 
          reviews={reviews} 
          isLoggedIn={isLoggedIn} 
          userReview={userReview} 
        />
      </section>

      {/* Related Products */}
      {relatedFinal.length > 0 && (
        <section className="mt-24 border-t border-gray-100 pt-16">
          <h2 className="text-2xl font-serif text-gray-900 tracking-tight mb-10 text-center">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {relatedFinal.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
