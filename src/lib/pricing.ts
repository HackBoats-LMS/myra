/**
 * Pricing utility helpers extracted from checkoutCart.
 * These pure functions contain no Prisma/DB calls and are unit-testable.
 */

export interface CartItem {
  price: number; // base price + variant offset
  quantity: number;
}

export interface Coupon {
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  timesUsed: number;
  minOrderAmount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
}

export interface PricingResult {
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

/**
 * Calculate order totals from a list of cart items and an optional coupon.
 * Throws on invalid/expired/over-limit coupons.
 */
export function calculateOrderTotal(items: CartItem[], coupon?: Coupon | null): PricingResult {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;

  if (coupon) {
    if (!coupon.isActive) {
      throw new Error('Invalid or inactive coupon code.');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error('This coupon code has expired.');
    }

    if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
      throw new Error('This coupon code has reached its usage limit.');
    }

    if (totalAmount < coupon.minOrderAmount) {
      throw new Error(
        `This coupon requires a minimum purchase of ₹${coupon.minOrderAmount.toFixed(2)}.`
      );
    }

    if (coupon.discountType === 'FIXED') {
      discountAmount = coupon.discountValue;
    } else {
      discountAmount = totalAmount * (coupon.discountValue / 100);
    }
  }

  const discount = Math.min(discountAmount, totalAmount);
  const finalAmount = Math.max(totalAmount - discount, 0);

  return { totalAmount, discountAmount: discount, finalAmount };
}
