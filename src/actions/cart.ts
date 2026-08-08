"use server"
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function addToCart(productId: string, quantity: number = 1) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.id) {
    // Database approach for logged in users
    const userId = (session?.user as any).id as string;
    let cart = await prisma.cart.findUnique({ where: { userId } });
    
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });
    
    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity }
      });
    }
  } else {
    // Cookie approach for guests
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    let cartItems: { productId: string, quantity: number }[] = [];
    
    if (cartCookie) {
      try {
        const parsed = JSON.parse(cartCookie.value);
        if (Array.isArray(parsed)) {
          // Strictly validate the payload shape to prevent injection
          cartItems = parsed.filter(i => 
            typeof i.productId === 'string' && 
            typeof i.quantity === 'number' && 
            i.quantity > 0
          ).slice(0, 50); // Hard limit to 50 items to prevent cookie bombing
        }
      } catch (e) {
        // Corrupted cookie, start fresh
      }
    }
    
    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += quantity;
      // Cap quantity to reasonable number to prevent overflow/abuse
      if (cartItems[existingItemIndex].quantity > 99) {
        cartItems[existingItemIndex].quantity = 99;
      }
    } else {
      if (cartItems.length < 50) {
        cartItems.push({ productId, quantity: Math.min(quantity, 99) });
      }
    }
    
    // Store in cookie for 30 days
    cookieStore.set('guest_cart', JSON.stringify(cartItems), { maxAge: 60 * 60 * 24 * 30 });
  }
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.id) {
    const userId = (session!.user as any).id;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    const item = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (item) {
      if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id: item.id } });
      } else {
        await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
      }
    }
  } else {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    if (!cartCookie) return;
    
    let cartItems: { productId: string, quantity: number }[] = [];
    try {
      const parsed = JSON.parse(cartCookie.value);
      if (Array.isArray(parsed)) {
        cartItems = parsed.filter(i => 
          typeof i.productId === 'string' && 
          typeof i.quantity === 'number'
        );
      }
    } catch (e) {
      return; // Stop if corrupted
    }
    
    const index = cartItems.findIndex(i => i.productId === productId);
    
    if (index > -1) {
      if (quantity <= 0) {
        cartItems.splice(index, 1);
      } else {
        cartItems[index].quantity = Math.min(quantity, 99);
      }
      cookieStore.set('guest_cart', JSON.stringify(cartItems), { maxAge: 60 * 60 * 24 * 30 });
    }
  }
}

export async function checkoutCart() {
  const session = await getServerSession(authOptions);
  
  if (!(session?.user as any)?.id) {
    throw new Error("You must be logged in to checkout.");
  }

  const userId = (session!.user as any).id;
  
  // Use a Prisma transaction to guarantee atomic execution
  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty.");
    }

    let totalAmount = 0;

    // Validate stock and calculate total securely
    for (const item of cart.items) {
      if (item.product.stockQuantity < item.quantity) {
        throw new Error(`Item ${item.product.name} is out of stock. Only ${item.product.stockQuantity} remaining.`);
      }
      totalAmount += item.product.price * item.quantity;
    }

    // Create the order
    await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING',
        paymentMethod: 'CASH_ON_DELIVERY',
        orderItems: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      }
    });

    // Decrement stock levels for all products
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }

    // Empty the cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  });
}
