/**
 * Pricing utility helpers extracted from checkoutCart.
 * These pure functions contain no Prisma/DB calls and are unit-testable.
 */

export interface CartItem {
  price: number; // base price + variant offset
  quantity: number;
}

export type CouponType = 'STANDARD' | 'FIRST_ORDER' | 'SINGLE_USE' | 'FESTIVAL' | 'SHIPPING';

export interface Coupon {
  type?: CouponType;
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
  shippingAmount: number;
}

export interface ShippingConfig {
  flatRate: number;
  freeShippingThreshold: number;
}

/**
 * Calculate shipping cost. Free shipping when the order total meets the
 * free-shipping threshold, or when a free-shipping offer is applied.
 */
export function calculateShipping(
  totalAmount: number,
  config: ShippingConfig,
  freeShipping = false
): number {
  if (freeShipping) return 0;
  if (totalAmount >= config.freeShippingThreshold) return 0;
  return config.flatRate;
}

/**
 * Amount to discount off shipping for a SHIPPING-type coupon.
 * A value of 0 (or >= shipping) means free shipping.
 */
export function calculateShippingDiscount(shippingAmount: number, couponValue: number): number {
  return Math.min(Math.max(couponValue, 0), shippingAmount);
}

/**
 * Calculate order totals from a list of cart items and an optional coupon.
 * Throws on invalid/expired/over-limit coupons.
 */
export function calculateOrderTotal(
  items: CartItem[],
  coupon?: Coupon | null,
  shippingConfig?: ShippingConfig | null
): PricingResult {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  const appliedType = coupon?.type || 'STANDARD';

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

    // SHIPPING-type coupons discount the shipping cost instead of the subtotal.
    if (appliedType !== 'SHIPPING') {
      if (coupon.discountType === 'FIXED') {
        discountAmount = coupon.discountValue;
      } else {
        discountAmount = totalAmount * (coupon.discountValue / 100);
      }
    }
  }

  const discount = Math.min(discountAmount, totalAmount);

  // Shipping: free if the threshold is met, or reduced/waived by a SHIPPING coupon.
  const config = shippingConfig || { flatRate: 0, freeShippingThreshold: 0 };
  let shippingAmount = calculateShipping(totalAmount, config, false);
  if (appliedType === 'SHIPPING' && coupon) {
    shippingAmount -= calculateShippingDiscount(shippingAmount, coupon.discountValue);
  }

  const finalAmount = Math.max(totalAmount - discount + shippingAmount, 0);

  return { totalAmount, discountAmount: discount, shippingAmount, finalAmount };
}
