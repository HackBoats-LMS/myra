import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyFlashDiscount, getActiveFlashSales } from "@/lib/flash-sale";

const MAX_CART_QUANTITY = 99;

export interface CartItemData {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

export interface CartLineItem {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    collectionId?: string | null;
    images: string[];
    stockQuantity?: number;
    collection?: { name: string | null } | null;
  };
  variant?: { priceOffset: number; size?: string | null; color?: string | null } | null;
  flashPrice?: number;
  flashPercent?: number;
}

/**
 * Load the current user's (or guest's) cart items, applying active flash-sale
 * pricing to each line so every surface (cart page, drawer, checkout) shows the
 * same discounted price. Returns [] for an empty/guest cart.
 */
export async function getCartItems(): Promise<CartLineItem[]> {
  const session = await getServerSession(authOptions);
  const sales = await getActiveFlashSales();

  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { include: { collection: true } }, variant: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return (cart?.items || []).map((item) => {
      const flash = applyFlashDiscount(item.product.price, item.product.originalPrice ?? null, sales, item.product.collectionId);
      return {
        ...item,
        flashPrice: flash.discounted ? flash.price : undefined,
        flashPercent: flash.discounted ? flash.percent : undefined,
      } as unknown as CartLineItem;
    });
  }

  const cookieStore = await cookies();
  const cartCookie = cookieStore.get("guest_cart");
  if (!cartCookie) return [];

  const parsed = parseGuestCartCookie(cartCookie.value);
  const productIds = parsed.map((p) => p.productId);
  const variantIds = parsed.map((p) => p.variantId).filter((id): id is string => Boolean(id));

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      include: { collection: true },
    }),
    prisma.productVariant.findMany({ where: { id: { in: variantIds } } }),
  ]);

  return parsed
    .map((p, idx) => {
      const prod = products.find((x) => x.id === p.productId);
      const vrnt = p.variantId ? variants.find((v) => v.id === p.variantId) : null;
      if (!prod) return null;
      const flash = applyFlashDiscount(prod.price, prod.originalPrice ?? null, sales, prod.collectionId);
      return {
        ...p,
        product: prod,
        variant: vrnt,
        id: `guest-${idx}`,
        flashPrice: flash.discounted ? flash.price : undefined,
        flashPercent: flash.discounted ? flash.percent : undefined,
      } as unknown as CartLineItem;
    })
    .filter(Boolean) as CartLineItem[];
}

export async function findExistingCartItem(
  cartId: string,
  productId: string,
  variantId?: string | null
) {
  return prisma.cartItem.findFirst({
    where: { cartId, productId, variantId: variantId || null }
  });
}

export async function upsertCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  variantId?: string | null
) {
  const existing = await findExistingCartItem(cartId, productId, variantId);

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + quantity, MAX_CART_QUANTITY);
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity }
    });
  }

  return prisma.cartItem.create({
    data: { cartId, productId, quantity: Math.min(quantity, MAX_CART_QUANTITY), variantId: variantId || null }
  });
}

export async function updateCartItemQuantity(
  cartId: string,
  productId: string,
  quantity: number,
  variantId?: string | null
) {
  const existing = await findExistingCartItem(cartId, productId, variantId);
  
  if (!existing) return null;
  
  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: existing.id } });
  }
  
  const capped = Math.min(Math.round(quantity), MAX_CART_QUANTITY);
  return prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity: capped }
  });
}

export async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

export async function mergeGuestCartItems(
  userId: string,
  guestItems: CartItemData[]
) {
  if (guestItems.length === 0) return;

  const cart = await getOrCreateCart(userId);

  // Validate each guest line up front and drop invalid ones (a product that no
  // longer exists, or a variant that isn't linked to its product). A single
  // stale/tampered line in a guest cookie must not abort the merge and silently
  // drop the user's entire guest cart on login (a FK failure inside the shared
  // transaction below would roll everything back).
  const productIds = guestItems.map((i) => i.productId);
  const variantIds = guestItems.map((i) => i.variantId).filter((id): id is string => Boolean(id));

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, productId: true },
    }),
  ]);

  const validProductIds = new Set(products.map((p) => p.id));
  const variantByProduct = new Map(variants.map((v) => [v.id, v.productId]));

  const validItems = guestItems.filter((item) => {
    if (!validProductIds.has(item.productId)) return false;
    if (item.variantId) {
      return variantByProduct.get(item.variantId) === item.productId;
    }
    return true;
  });

  if (validItems.length === 0) return;

  // Batch all item mutations in a single transaction: atomic and holds one
  // connection instead of opening one per item (kills the N+1 round trips).
  await prisma.$transaction(async (tx) => {
    for (const item of validItems) {
      const existing = await tx.cartItem.findFirst({
        where: { cartId: cart.id, productId: item.productId, variantId: item.variantId || null },
      });
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + item.quantity, MAX_CART_QUANTITY);
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: Math.min(item.quantity, MAX_CART_QUANTITY),
          },
        });
      }
    }
  });
}

export function parseGuestCartCookie(cookieValue: string | undefined): CartItemData[] {
  if (!cookieValue) return [];
  
  try {
    const parsed = JSON.parse(cookieValue);
    if (!Array.isArray(parsed)) return [];
    
    return parsed
      .filter(
        (i) =>
          typeof i.productId === "string" &&
          typeof i.quantity === "number" &&
          i.quantity > 0
      )
      .slice(0, 50);
  } catch {
    return [];
  }
}