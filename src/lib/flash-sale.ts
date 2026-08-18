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

/**
 * Find the flash sale that applies to a product. A collection-scoped sale only
 * applies when its collection matches the product's; a global sale (no
 * collection) applies to any product. A matching collection sale wins over a
 * global sale; if neither matches, no sale applies.
 */
function findApplicableSale(
  sales: FlashSaleWithCollection[],
  collectionId: string | null
): FlashSaleWithCollection | null {
  let global: FlashSaleWithCollection | null = null;
  for (const sale of sales) {
    if (sale.collectionId) {
      if (collectionId && sale.collectionId === collectionId) return sale;
    } else if (!global) {
      global = sale;
    }
  }
  return global;
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
  const applied = findApplicableSale(sales, collectionId);
  if (!applied) {
    return { price, originalPrice, discounted: false, percent: 0 };
  }

  let newPrice = price;
  if (applied.discountType === "PERCENTAGE") {
    // Clamp so a percentage > 100 (or a misconfiguration) can never go negative.
    newPrice = Math.max(price - (price * applied.value) / 100, 0);
  } else {
    // Clamp a fixed discount to the full price so the item is never free/negative.
    newPrice = Math.max(price - Math.min(applied.value, price), 0);
  }

  const discounted = newPrice < price;
  // The "Flash X% OFF" badge reflects the flash sale discount applied to the
  // selling price (not the compounded discount off the MRP), so a configured
  // 90% sale shows 90% regardless of the product's original price.
  const percent = price > 0 ? Math.min(Math.round(((price - newPrice) / price) * 100), 100) : 0;

  return {
    price: discounted ? Math.round(newPrice * 100) / 100 : price,
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