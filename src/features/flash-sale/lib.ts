import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";

export const FLASH_SALE_TAG = "flash-sales";

type FlashSaleWithCollection = Prisma.FlashSaleGetPayload<{ include: { collection: true } }>;

async function fetchActiveFlashSales(): Promise<FlashSaleWithCollection[]> {
  const now = new Date();
  return prisma.flashSale.findMany({
    where: { isActive: true, startAt: { lte: now }, endAt: { gte: now } },
    include: { collection: true },
    orderBy: { endAt: "asc" },
  });
}

export const getActiveFlashSales = unstable_cache(fetchActiveFlashSales, ["flash-sales"], {
  tags: [FLASH_SALE_TAG],
  revalidate: 30,
});

// Approximate the rupee value of a sale for precedence: a PERCENTAGE sale is
// applied against the full price; a FIXED sale is its value (capped at price).
// Used only to pick the best (largest) sale when several overlap.
function saleValue(sale: FlashSaleWithCollection, price: number): number {
  if (sale.discountType === "PERCENTAGE") return price * (sale.value / 100);
  return Math.min(sale.value, price);
}

/**
 * Find the flash sale that applies to a product. A collection-scoped sale only
 * applies when its collection matches the product's; a global sale (no
 * collection) applies to any product. When several sales overlap the same
 * product, the one offering the largest rupee discount wins (within the same
 * scope), falling back to a global sale if no collection sale matches.
 */
function findApplicableSale(
  sales: FlashSaleWithCollection[],
  collectionId: string | null,
  price: number
): FlashSaleWithCollection | null {
  let bestCollection: FlashSaleWithCollection | null = null;
  let bestCollectionValue = -1;
  let bestGlobal: FlashSaleWithCollection | null = null;
  let bestGlobalValue = -1;

  for (const sale of sales) {
    const value = saleValue(sale, price);
    if (sale.collectionId) {
      if (collectionId && sale.collectionId === collectionId && value > bestCollectionValue) {
        bestCollectionValue = value;
        bestCollection = sale;
      }
    } else if (value > bestGlobalValue) {
      bestGlobalValue = value;
      bestGlobal = sale;
    }
  }

  return bestCollection || bestGlobal;
}

export function applyFlashDiscount(
  price: number,
  originalPrice: number | null,
  sales: FlashSaleWithCollection[],
  collectionId: string | null = null
): {
  price: number;
  originalPrice: number | null;
  discounted: boolean;
  percent: number;
} {
  const applied = findApplicableSale(sales, collectionId, price);
  if (!applied) {
    return { price, originalPrice, discounted: false, percent: 0 };
  }

  let newPrice = price;
  if (applied.discountType === "PERCENTAGE") {
    // Clamp the percentage discount so a 100%+ (or misconfigured) sale can never
    // give an item away free or negative: cap at 99%, keeping at least 1% value.
    const cappedValue = Math.min(applied.value, 99);
    newPrice = Math.max(price - (price * cappedValue) / 100, 0);
  } else {
    // Clamp a fixed discount so the item is never free or negative: cap the
    // discount at 99% of the price, keeping at least 1% of its value.
    const maxDiscount = price * 0.99;
    newPrice = Math.max(price - Math.min(applied.value, maxDiscount), 0);
  }

  // Round to cents FIRST, then decide whether a discount actually applies, so a
  // tiny discount that rounds back to the original price doesn't leave a stale
  // "discounted" flag / strikethrough / 0% badge.
  const roundedPrice = Math.max(Math.round(newPrice * 100) / 100, 0);
  const discounted = roundedPrice < price;
  // The "Flash X% OFF" badge reflects the flash sale discount applied to the
  // selling price (not the compounded discount off the MRP), so a configured
  // 90% sale shows 90% regardless of the product's original price.
  const percent = price > 0 && discounted ? Math.min(Math.round(((price - roundedPrice) / price) * 100), 100) : 0;

  return {
    price: discounted ? roundedPrice : price,
    // When flashed, the strikethrough is the pre-flash selling price so the
    // displayed prices (price -> originalPrice) reconcile with the badge.
    originalPrice: discounted ? price : originalPrice,
    discounted,
    percent,
  };
}

export function isProductInFlashSale(
  product: { price: number; originalPrice: number | null; collectionId?: string | null },
  sales: FlashSaleWithCollection[]
) {
  return applyFlashDiscount(product.price, product.originalPrice, sales, product.collectionId ?? null);
}

type Priceable = { price: number; originalPrice: number | null; collectionId?: string | null };

/** Map a product list to reflect the active flash sale pricing (returns copies). */
export function applyFlashToProductList<T extends Priceable>(products: T[], sales: FlashSaleWithCollection[]) {
  if (sales.length === 0) return products;
  return products.map((p) => {
    const { price, originalPrice, percent } = applyFlashDiscount(
      p.price,
      p.originalPrice,
      sales,
      p.collectionId ?? null
    );
    return { ...p, price, originalPrice, flashPercent: percent > 0 ? percent : undefined };
  });
}