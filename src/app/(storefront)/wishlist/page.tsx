import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import ProductCard from "@/components/storefront/ProductCard";
import MoveToCartButton from "@/components/storefront/MoveToCartButton";
import type { Prisma, Product } from "@/generated/prisma";

type WishlistItem = Prisma.WishlistItemGetPayload<{
  include: { product: { include: { reviews: { select: { rating: true } } } } };
}>;

type WishlistProduct = Omit<Product, "reviews"> & { reviewCount: number; averageRating: number };

function parseGuestWishlistCookie(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function computeReviews(product: { reviews: { rating: number }[] }) {
  const reviews = product.reviews;
  const reviewCount = reviews?.length || 0;
  const averageRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;
  return { reviewCount, averageRating };
}

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  let itemsWithReviews: { id: string; product: WishlistProduct }[] = [];

  try {
    if (userId) {
      const wishlist = await prisma.wishlist.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: { include: { reviews: { select: { rating: true } } } } },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      itemsWithReviews =
        wishlist?.items.map((item: WishlistItem) => {
          const { id, slug, name, price, images } = item.product;
          return {
            id: item.id,
            product: { id, slug, name, price, images, ...computeReviews(item.product) } as WishlistProduct,
          };
        }) || [];
    } else {
      const cookieStore = await cookies();
      const productIds = parseGuestWishlistCookie(cookieStore.get("guest_wishlist")?.value);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { reviews: { select: { rating: true } } },
        });
        itemsWithReviews = products.map((p) => ({
          id: `guest-${p.id}`,
          product: {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            images: p.images,
            ...computeReviews(p),
          } as WishlistProduct,
        }));
      }
    }
  } catch (error) {
    console.warn("Database unreachable in WishlistPage:", error);
    // Silent fail to empty wishlist UI
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">Wishlist</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">{itemsWithReviews.length} items saved</p>
        </div>

        {itemsWithReviews.length === 0 ? (
          <div className="text-center text-gray-500 py-20 bg-white border border-[#B6925B]/20 rounded-sm">You haven&rsquo;t saved any items yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {itemsWithReviews.map((item) => (
              <div key={item.id} className="flex flex-col group">
                <ProductCard product={item.product} isWishlisted={true} />
                <MoveToCartButton productId={item.product.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}