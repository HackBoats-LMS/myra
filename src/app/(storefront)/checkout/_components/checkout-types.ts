"use client";

export interface CheckoutAddress {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
}

export interface CheckoutGift {
  name: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutShipping {
  flatRate: number;
  freeShippingThreshold: number;
}

export interface CheckoutOrderLine {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  variantLabel?: string;
  images?: string[];
  unitPrice: number;
  originalUnitPrice?: number;
  flashPercent?: number;
}

export interface CheckoutPricing {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  finalTotal: number;
}
