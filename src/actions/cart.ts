"use server"
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { sendEmail } from "@/lib/email";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { 
  upsertCartItem, 
  updateCartItemQuantity, 
  getOrCreateCart, 
  mergeGuestCartItems,
  parseGuestCartCookie 
} from "@/lib/cart-service";
import { CACHE_TAGS } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

const LOW_STOCK_THRESHOLD = 5;

export async function addToCart(productId: string, quantity: number = 1, variantId?: string) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    const cart = await getOrCreateCart(session.user.id);
    await upsertCartItem(cart.id, productId, quantity, variantId);
  } else {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    const cartItems = parseGuestCartCookie(cartCookie?.value);
    
    const existingItemIndex = cartItems.findIndex(item => 
      item.productId === productId && (item.variantId || null) === (variantId || null)
    );
    
    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity = Math.min(cartItems[existingItemIndex].quantity + quantity, 99);
    } else {
      if (cartItems.length < 50) {
        cartItems.push({ productId, quantity: Math.min(quantity, 99), variantId });
      }
    }
    
    cookieStore.set('guest_cart', JSON.stringify(cartItems), { maxAge: 60 * 60 * 24 * 30 });
  }

  revalidatePath("/");
}

export async function updateCartQuantity(productId: string, quantity: number, variantId?: string) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (cart) {
      await updateCartItemQuantity(cart.id, productId, quantity, variantId);
    }
  } else {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    if (cartCookie) {
      try {
        let parsed = parseGuestCartCookie(cartCookie.value);
        if (quantity <= 0) {
          parsed = parsed.filter(i => 
            !(i.productId === productId && (i.variantId || null) === (variantId || null))
          );
        } else {
          const index = parsed.findIndex(i => 
            i.productId === productId && (i.variantId || null) === (variantId || null)
          );
          if (index > -1) {
            parsed[index].quantity = quantity;
          }
        }
        cookieStore.set('guest_cart', JSON.stringify(parsed), { maxAge: 60 * 60 * 24 * 30 });
      } catch {
        // Ignore malformed cookie
      }
    }
  }
  revalidatePath("/");
}

export async function checkoutCart(addressId: string, couponCode?: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("You must be logged in to checkout.");
  }

  const userId = session.user.id;
  const userEmail = session.user.email;
  const userName = session.user.name || "Customer";

  const limitResult = rateLimit(`checkout_${userId}`, 5, 60 * 1000);
  if (!limitResult.success) {
    throw new Error("Too many checkout attempts. Please try again in a minute.");
  }
  
  const result = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty.");
    }

    const address = await tx.address.findUnique({
      where: { id: addressId }
    });
    if (!address || address.userId !== userId) {
      throw new Error("Invalid delivery address selected.");
    }

    const items = cart.items.map(item => ({
      price: item.product.price + (item.variant?.priceOffset || 0),
      quantity: item.quantity
    }));

    let discountAmount = 0;
    let finalAmount = 0;

    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      const dbCoupon = await tx.coupon.findUnique({ where: { code } });
      
      if (!dbCoupon || !dbCoupon.isActive) {
        throw new Error("Invalid or inactive coupon code.");
      }
      
      if (dbCoupon.expiresAt && new Date(dbCoupon.expiresAt) < new Date()) {
        throw new Error("This coupon code has expired.");
      }

      if (dbCoupon.maxUses && dbCoupon.timesUsed >= dbCoupon.maxUses) {
        throw new Error("This coupon code has reached its usage limit.");
      }

      const { calculateOrderTotal } = await import("@/lib/pricing");
      const pricing = calculateOrderTotal(items, {
        isActive: dbCoupon.isActive,
        expiresAt: dbCoupon.expiresAt,
        maxUses: dbCoupon.maxUses,
        timesUsed: dbCoupon.timesUsed,
        minOrderAmount: dbCoupon.minOrderAmount,
        discountType: dbCoupon.discountType,
        discountValue: dbCoupon.discountValue
      });
      
      discountAmount = pricing.discountAmount;
      finalAmount = pricing.finalAmount;

      await tx.coupon.update({
        where: { id: dbCoupon.id },
        data: { timesUsed: { increment: 1 } }
      });
    } else {
      const { calculateOrderTotal } = await import("@/lib/pricing");
      const pricing = calculateOrderTotal(items);
      discountAmount = pricing.discountAmount;
      finalAmount = pricing.finalAmount;
    }

    const order = await tx.order.create({
      data: {
        userId,
        addressId,
        totalAmount: finalAmount,
        couponCode: couponCode || null,
        discountAmount,
        status: 'PENDING',
        paymentMethod: 'CASH_ON_DELIVERY',
        orderItems: {
          create: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.product.price + (item.variant?.priceOffset || 0)
          }))
        }
      }
    });

    for (const item of cart.items) {
      if (item.variantId) {
        const res = await tx.productVariant.updateMany({
          where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        if (res.count === 0) {
          throw new Error(
            `Insufficient stock for ${item.product.name} (${item.variant?.size}/${item.variant?.color}).`
          );
        }
      } else {
        const res = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } }
        });
        if (res.count === 0) {
          throw new Error(`Insufficient stock for "${item.product.name}".`);
        }
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return {
      orderId: order.id,
      finalAmount,
      items: cart.items.map(item => ({
        productId: item.productId,
        name: `${item.product.name}${item.variant ? ` (${item.variant.size}/${item.variant.color})` : ''}`,
        quantity: item.quantity,
        price: item.product.price + (item.variant?.priceOffset || 0)
      }))
    };
  });

  if (userEmail) {
    await sendEmail({
      to: userEmail,
      subject: `Your Myra Order Receipt #${result.orderId.substring(0, 8)}`,
      react: OrderConfirmationEmail({
        orderId: result.orderId,
        customerName: userName,
        totalAmount: result.finalAmount,
        items: result.items
      })
    });
  }

  // Alert admin if any ordered product dropped to low stock
  const lowStock = await prisma.product.findMany({
    where: {
      id: { in: result.items.map((i) => i.productId) },
      deletedAt: null,
      stockQuantity: { lte: LOW_STOCK_THRESHOLD },
    },
    select: { name: true, stockQuantity: true },
  });
  if (lowStock.length > 0) {
    const { sendLowStockAlert } = await import("@/lib/email");
    sendLowStockAlert(lowStock.map((p) => ({ name: p.name, stockQuantity: p.stockQuantity }))).catch(console.error);
  }

  revalidatePath("/");
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.cart(userId));

  return result;
}

export async function mergeGuestCart(userId: string, cookieValue: string | undefined) {
  const guestItems = parseGuestCartCookie(cookieValue);
  if (guestItems.length === 0) return;
  
  await mergeGuestCartItems(userId, guestItems);
}

export async function getCart() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { include: { collection: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return cart?.items || [];
  } else {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    if (!cartCookie) return [];
    
    try {
      const parsed = parseGuestCartCookie(cartCookie.value);
      const productIds = parsed.map(p => p.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        include: { collection: true }
      });
      
      return parsed.map(p => {
        const prod = products.find(prod => prod.id === p.productId);
        return prod ? { ...p, product: prod, id: `guest-${prod.id}` } : null;
      }).filter(Boolean);
    } catch {
      return [];
    }
  }
}

export async function validateCouponAction(code: string, cartTotal: number) {
  const codeUpper = code.trim().toUpperCase();
  const dbCoupon = await prisma.coupon.findUnique({ where: { code: codeUpper } });
  
  if (!dbCoupon || !dbCoupon.isActive) {
    throw new Error("Invalid or inactive coupon code.");
  }
  
  if (dbCoupon.expiresAt && new Date(dbCoupon.expiresAt) < new Date()) {
    throw new Error("This coupon code has expired.");
  }

  if (dbCoupon.maxUses && dbCoupon.timesUsed >= dbCoupon.maxUses) {
    throw new Error("This coupon code has reached its usage limit.");
  }

  if (cartTotal < dbCoupon.minOrderAmount) {
    throw new Error(`This coupon requires a minimum purchase of ₹${dbCoupon.minOrderAmount.toFixed(2)}.`);
  }

  return {
    code: dbCoupon.code,
    type: dbCoupon.discountType,
    value: dbCoupon.discountValue
  };
}
