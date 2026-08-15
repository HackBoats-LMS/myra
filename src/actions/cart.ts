"use server"
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { sendEmail } from "@/lib/email";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { isPincodeDeliverable } from "@/actions/pincode";
import { 
  upsertCartItem, 
  updateCartItemQuantity, 
  getOrCreateCart, 
  mergeGuestCartItems,
  parseGuestCartCookie 
} from "@/lib/cart-service";
import { CACHE_TAGS } from "@/lib/cache";
import type { Coupon, Prisma, $Enums } from "@/generated/prisma";

const LOW_STOCK_THRESHOLD = 5;

// Types eligible for automatic application at checkout (best value wins).
const AUTO_APPLY_TYPES: $Enums.CouponType[] = ["FIRST_ORDER", "SINGLE_USE", "FESTIVAL"];

async function loadShippingConfig(tx: Prisma.TransactionClient) {
  const config = await tx.shippingConfig.findUnique({ where: { id: "global" } });
  return config || { flatRate: 49, freeShippingThreshold: 999 };
}

async function isCouponAllowedForUser(
  tx: Prisma.TransactionClient,
  coupon: Coupon,
  userId: string
): Promise<boolean> {
  if (coupon.type === "FIRST_ORDER") {
    const orderCount = await tx.order.count({ where: { userId } });
    if (orderCount > 0) return false;
  }
  if (coupon.maxUsesPerUser) {
    const usage = await tx.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (usage >= coupon.maxUsesPerUser) return false;
  }
  return true;
}

function estimateDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === "FIXED") return coupon.discountValue;
  return subtotal * (coupon.discountValue / 100);
}

/**
 * Resolve the coupon to apply. If a code is provided it is validated for the
 * user (including per-user rules). Otherwise the best automatically-eligible
 * offer (FIRST_ORDER / SINGLE_USE / FESTIVAL) is selected.
 */
async function resolveCheckoutCoupon(
  tx: Prisma.TransactionClient,
  userId: string,
  couponCode: string | undefined,
  subtotal: number
): Promise<{ coupon: Coupon | null }> {
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
    if (subtotal < dbCoupon.minOrderAmount) {
      throw new Error(`This coupon requires a minimum purchase of ₹${dbCoupon.minOrderAmount.toFixed(2)}.`);
    }
    if (!(await isCouponAllowedForUser(tx, dbCoupon, userId))) {
      throw new Error("This coupon is not applicable to your account.");
    }
    return { coupon: dbCoupon };
  }

  // Auto-apply the best eligible offer.
  const candidates = await tx.coupon.findMany({
    where: { type: { in: AUTO_APPLY_TYPES }, isActive: true },
  });

  let best: Coupon | null = null;
  let bestValue = -1;
  for (const c of candidates) {
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) continue;
    if (c.maxUses && c.timesUsed >= c.maxUses) continue;
    if (subtotal < c.minOrderAmount) continue;
    if (!(await isCouponAllowedForUser(tx, c, userId))) continue;
    const value = estimateDiscount(c, subtotal);
    if (value > bestValue) {
      bestValue = value;
      best = c;
    }
  }
  return { coupon: best };
}

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

export interface GiftDetails {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Read-only estimate of the final checkout total. Used to create the Razorpay
// order before any DB order / stock side effects happen.
export async function estimateCheckoutTotal(opts: {
  userId: string;
  couponCode?: string;
}): Promise<{ finalAmount: number }> {
  const cart = await prisma.cart.findUnique({
    where: { userId: opts.userId },
    include: { items: { include: { product: true, variant: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const items = cart.items.map((item) => ({
    price: item.product.price + (item.variant?.priceOffset || 0),
    quantity: item.quantity,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingConfig = await loadShippingConfig(prisma as Prisma.TransactionClient);
  const { coupon: dbCoupon } = await resolveCheckoutCoupon(prisma as Prisma.TransactionClient, opts.userId, opts.couponCode, subtotal);
  const { calculateOrderTotal } = await import("@/lib/pricing");
  const pricing = calculateOrderTotal(
    items,
    dbCoupon
      ? {
          type: dbCoupon.type,
          isActive: dbCoupon.isActive,
          expiresAt: dbCoupon.expiresAt,
          maxUses: dbCoupon.maxUses,
          timesUsed: dbCoupon.timesUsed,
          minOrderAmount: dbCoupon.minOrderAmount,
          discountType: dbCoupon.discountType,
          discountValue: dbCoupon.discountValue,
        }
      : null,
    shippingConfig
  );
  return { finalAmount: pricing.finalAmount };
}

interface CreateOrderOptions {
  userId: string;
  addressId: string;
  gift?: GiftDetails;
  couponCode?: string;
  phone?: string;
  paymentMethod: $Enums.PaymentMethod;
  paymentStatus?: $Enums.PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
}

export interface CheckoutResult {
  orderId: string;
  finalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  appliedCouponCode: string | null;
  items: { productId: string; name: string; quantity: number; price: number }[];
}

export async function createOrderTransaction(opts: CreateOrderOptions): Promise<CheckoutResult> {
  const { userId, addressId, gift, couponCode, phone } = opts;
  const giftMode = Boolean(gift && Object.values(gift).some((v) => v !== undefined));

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty.");
    }

    let orderAddressId: string | null = addressId;

    if (giftMode && gift) {
      const g = gift;
      if (!g.name?.trim()) throw new Error("Please provide the recipient's name.");
      if (!/^\d{10}$/.test((g.phone || "").trim())) {
        throw new Error("Please provide a valid 10-digit recipient phone number.");
      }
      if (!g.addressLine1?.trim() || !g.city?.trim() || !g.state?.trim() || !g.postalCode?.trim() || !g.country?.trim()) {
        throw new Error("Please provide the complete recipient delivery address.");
      }
      orderAddressId = null;
    } else {
      const address = await tx.address.findUnique({
        where: { id: addressId }
      });
      if (!address || address.userId !== userId) {
        throw new Error("Invalid delivery address selected.");
      }

      const contactPhone = (phone || "").trim();
      if (!/^\d{10}$/.test(contactPhone)) {
        throw new Error("A valid 10-digit phone number is required to place your order.");
      }

      const checkoutUser = await tx.user.findUnique({
        where: { id: userId },
        select: { phoneNumber: true, phoneNumber2: true },
      });
      const hasAnyAccountPhone = Boolean(checkoutUser?.phoneNumber || checkoutUser?.phoneNumber2);

      if (!hasAnyAccountPhone) {
        const phoneConflict = await tx.user.findFirst({
          where: {
            OR: [{ phoneNumber: contactPhone }, { phoneNumber2: contactPhone }],
            id: { not: userId },
          },
        });
        if (phoneConflict) {
          throw new Error("This phone number is already linked to another account.");
        }
        await tx.user.update({
          where: { id: userId },
          data: { phoneNumber: contactPhone },
        });
      }

      await tx.address.update({
        where: { id: address.id },
        data: { phone: contactPhone },
      });
    }

    const deliveryPincode = giftMode && gift ? gift.postalCode?.trim() : orderAddressId ? (await tx.address.findUnique({ where: { id: orderAddressId } }))?.postalCode : null;
    if (deliveryPincode && !(await isPincodeDeliverable(deliveryPincode))) {
      throw new Error(`Delivery is not available to pincode ${deliveryPincode}. Please use a different address or contact support.`);
    }

    const items = cart.items.map(item => ({
      price: item.product.price + (item.variant?.priceOffset || 0),
      quantity: item.quantity
    }));

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingConfig = await loadShippingConfig(tx);
    const { coupon: dbCoupon } = await resolveCheckoutCoupon(tx, userId, couponCode, subtotal);

    const { calculateOrderTotal } = await import("@/lib/pricing");
    const pricing = calculateOrderTotal(
      items,
      dbCoupon
        ? {
            type: dbCoupon.type,
            isActive: dbCoupon.isActive,
            expiresAt: dbCoupon.expiresAt,
            maxUses: dbCoupon.maxUses,
            timesUsed: dbCoupon.timesUsed,
            minOrderAmount: dbCoupon.minOrderAmount,
            discountType: dbCoupon.discountType,
            discountValue: dbCoupon.discountValue,
          }
        : null,
      shippingConfig
    );

    const discountAmount = pricing.discountAmount;
    const shippingAmount = pricing.shippingAmount;
    const finalAmount = pricing.finalAmount;
    const appliedCouponCode = dbCoupon ? dbCoupon.code : null;

    if (dbCoupon) {
      await tx.coupon.update({
        where: { id: dbCoupon.id },
        data: { timesUsed: { increment: 1 } }
      });
      if (dbCoupon.maxUsesPerUser || dbCoupon.type === "FIRST_ORDER" || dbCoupon.type === "SINGLE_USE") {
        await tx.couponUsage.upsert({
          where: { couponId_userId: { couponId: dbCoupon.id, userId } },
          create: { couponId: dbCoupon.id, userId },
          update: {},
        });
      }
    }

    const order = await tx.order.create({
      data: {
        userId,
        addressId: orderAddressId,
        totalAmount: finalAmount,
        couponCode: appliedCouponCode,
        discountAmount,
        shippingAmount,
        status: 'PENDING',
        paymentMethod: opts.paymentMethod,
        paymentStatus: opts.paymentStatus || 'UNPAID',
        razorpayOrderId: opts.razorpayOrderId || null,
        razorpayPaymentId: opts.razorpayPaymentId || null,
        razorpaySignature: opts.razorpaySignature || null,
        ...(giftMode && gift
          ? {
              giftName: gift.name.trim(),
              giftPhone: gift.phone.trim(),
              giftAddressLine1: gift.addressLine1.trim(),
              giftCity: gift.city.trim(),
              giftState: gift.state.trim(),
              giftPostalCode: gift.postalCode.trim(),
              giftCountry: gift.country.trim(),
            }
          : {}),
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
      subtotal,
      discountAmount,
      shippingAmount,
      appliedCouponCode,
      items: cart.items.map(item => ({
        productId: item.productId,
        name: `${item.product.name}${item.variant ? ` (${item.variant.size}/${item.variant.color})` : ''}`,
        quantity: item.quantity,
        price: item.product.price + (item.variant?.priceOffset || 0)
      }))
    };
  });
}

export async function checkoutCart(addressId: string, couponCode?: string, phone?: string, gift?: GiftDetails) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("You must be logged in to checkout.");
  }

  const userId = session.user.id;
  const userEmail = session.user.email;
  const userName = session.user.name || "Customer";

  const result = await createOrderTransaction({
    userId,
    addressId,
    couponCode,
    phone,
    gift,
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'UNPAID',
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

  // Notify admin of the new order.
  {
    const { sendAdminNewOrderEmail } = await import("@/lib/email");
    sendAdminNewOrderEmail({
      orderId: result.orderId,
      customerName: userName,
      totalAmount: result.finalAmount,
      paymentMethod: "Cash on Delivery",
      itemCount: result.items.reduce((sum, i) => sum + i.quantity, 0),
    }).catch(console.error);
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

  // Per-user rules require a logged-in user.
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const allowed = await isCouponAllowedForUser(prisma, dbCoupon, session.user.id);
    if (!allowed) {
      throw new Error(
        dbCoupon.type === "FIRST_ORDER"
          ? "This offer is valid for first orders only."
          : "You have already used this coupon."
      );
    }
  }

  return {
    code: dbCoupon.code,
    type: dbCoupon.discountType,
    couponType: dbCoupon.type,
    value: dbCoupon.discountValue
  };
}
