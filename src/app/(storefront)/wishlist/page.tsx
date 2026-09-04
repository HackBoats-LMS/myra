import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { cookies } from "next/headers";
import ProductCard from "@/components/shared/ProductCard";
import MoveToCartButton from "@/app/(storefront)/wishlist/_components/MoveToCartButton";
import MoveAllToBagButton from "@/app/(storefront)/wishlist/_components/MoveAllToBagButton";
import type { Prisma } from "@/generated/prisma";
import { getActiveFlashSales, applyFlashDiscount } from "@/lib/flash-sale";
import { verifyCookieValue } from "@/lib/cookie-signing";

type WishlistItem = Prisma.WishlistItemGetPayload<{
  include: { product: { include: { reviews: { select: { rating: true } } } } };
}>;

type WishlistProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  flashPercent?: number;
  images: string[];
  reviewCount: number;
  averageRating: number;
};

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
    const sales = await getActiveFlashSales();
    const apply = (p: { price: number; originalPrice: number | null; collectionId?: string | null }) =>
      applyFlashDiscount(p.price, p.originalPrice, sales, p.collectionId ?? null);

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
          const { id, slug, name, originalPrice, images } = item.product;
          const flash = apply(item.product);
          return {
            id: item.id,
            product: {
              id, slug, name,
              price: flash.price,
              originalPrice: flash.discounted ? flash.originalPrice : originalPrice,
              flashPercent: flash.discounted ? flash.percent : undefined,
              images,
              ...computeReviews(item.product),
            } as WishlistProduct,
          };
        }) || [];
    } else {
      const cookieStore = await cookies();
      const rawWishlistData = verifyCookieValue(cookieStore.get("guest_wishlist")?.value);
      const productIds = parseGuestWishlistCookie(rawWishlistData ?? cookieStore.get("guest_wishlist")?.value);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds }, deletedAt: null },
          include: { reviews: { select: { rating: true } } },
        });
        itemsWithReviews = products.map((p) => ({
          id: `guest-${p.id}`,
          product: {
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: apply(p).price,
            originalPrice: apply(p).discounted ? apply(p).originalPrice : p.originalPrice,
            flashPercent: apply(p).discounted ? apply(p).percent : undefined,
            images: p.images,
            ...computeReviews(p),
          } as WishlistProduct,
        }));
      }
    }
  } catch (error) {
    console.warn("Database unreachable in WishlistPage:", error instanceof Error ? error.message : "unknown error");
    // Silent fail to empty wishlist UI
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">Wishlist</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">{itemsWithReviews.length} items saved</p>
          {itemsWithReviews.length > 0 && (
            <MoveAllToBagButton productIds={itemsWithReviews.map((i) => i.product.id)} />
          )}
        </div>

        {itemsWithReviews.length === 0 ? (
          <div className="text-center text-[#B6925B] text-[10px] uppercase font-bold tracking-widest py-10 md:py-10 md:py-20 bg-white border border-[#B6925B]/20 rounded-none">You haven&rsquo;t saved any items yet.</div>
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
