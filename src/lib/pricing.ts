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
  shippingAmount: number;
  codHandlingFee: number;
  taxAmount: number;
  finalAmount: number;
}

export interface ShippingConfig {
  flatRate: number;
  freeShippingThreshold: number;
  codFlatRate?: number;
  codFreeShippingThreshold?: number;
  codHandlingFee?: number;
}

/**
 * Calculate shipping cost. Free shipping when the order total meets the
 * free-shipping threshold, or when a free-shipping offer is applied.
 */
export function calculateShipping(
  totalAmount: number,
  config: ShippingConfig,
  freeShipping = false,
  isCod = false
): number {
  if (freeShipping) return 0;
  const activeRate = isCod && typeof config.codFlatRate === "number" ? config.codFlatRate : config.flatRate;
  const activeThreshold = isCod && typeof config.codFreeShippingThreshold === "number" ? config.codFreeShippingThreshold : config.freeShippingThreshold;
  if (totalAmount >= activeThreshold) return 0;
  return activeRate;
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
  shippingConfig?: ShippingConfig | null,
  taxPercent: number = 0,
  paymentMethod: 'CASH_ON_DELIVERY' | 'RAZORPAY' | 'COD' = 'RAZORPAY'
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
  const isCod = paymentMethod === 'CASH_ON_DELIVERY' || paymentMethod === 'COD';
  const config = shippingConfig || { flatRate: 0, freeShippingThreshold: 0 };
  let shippingAmount = calculateShipping(totalAmount, config, false, isCod);
  if (appliedType === 'SHIPPING' && coupon) {
    shippingAmount -= calculateShippingDiscount(shippingAmount, coupon.discountValue);
  }

  const codHandlingFee = isCod ? Math.max(0, config.codHandlingFee ?? 0) : 0;

  // Tax is applied to the discounted subtotal (plus shipping and COD handling).
  const taxBase = Math.max(totalAmount - discount, 0) + shippingAmount + codHandlingFee;
  const taxAmount = taxPercent > 0 ? Math.round((taxBase * (taxPercent / 100)) * 100) / 100 : 0;

  const finalAmount = Math.max(taxBase + taxAmount, 0);

  // Round all money fields to 2 decimals so the stored order total always
  // matches the paise amount sent to (and refunded from) the gateway.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    totalAmount: round2(totalAmount),
    discountAmount: round2(discount),
    shippingAmount: round2(shippingAmount),
    codHandlingFee: round2(codHandlingFee),
    taxAmount: round2(taxAmount),
    finalAmount: round2(finalAmount),
  };
}
