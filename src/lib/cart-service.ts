import { prisma } from "@/lib/prisma";

export interface CartItemData {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

export async function findExistingCartItem(
  cartId: string,
  productId: string,
  variantId?: string | null
) {
  const existingItems = await prisma.cartItem.findMany({
    where: { cartId, productId }
  });
  return existingItems.find(i => (i.variantId || null) === (variantId || null));
}

export async function upsertCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  variantId?: string | null
) {
  const existing = await findExistingCartItem(cartId, productId, variantId);
  
  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    });
  }
  
  return prisma.cartItem.create({
    data: { cartId, productId, quantity, variantId: variantId || null }
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
  
  return prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity }
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
  const cart = await getOrCreateCart(userId);
  
  for (const item of guestItems) {
    await upsertCartItem(cart.id, item.productId, item.quantity, item.variantId);
  }
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