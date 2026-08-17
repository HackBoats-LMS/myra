import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

function requireRazorpay() {
  if (!razorpayConfigured()) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file to enable online payments."
    );
  }
}

async function getClient() {
  requireRazorpay();
  const mod = await import("razorpay");
  return new mod.default({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

export function getRazorpayKeyId(): string {
  requireRazorpay();
  return KEY_ID;
}

export async function createRazorpayOrder(options: {
  amount: number; // in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const client = await getClient();
  return client.orders.create({
    amount: Math.round(options.amount),
    currency: options.currency || "INR",
    receipt: options.receipt,
    notes: options.notes || {},
  });
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  requireRazorpay();
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export async function fetchRazorpayPayment(paymentId: string) {
  const client = await getClient();
  return client.payments.fetch(paymentId);
}

export async function refundRazorpayPayment(paymentId: string, amountPaise: number) {
  const client = await getClient();
  return client.payments.refund(paymentId, { amount: Math.round(amountPaise) });
}

/**
 * Reconcile whether a refund actually went through on the gateway after a
 * refund call failed (e.g. a request that timed out after Razorpay processed
 * it). Returns true only when the payment reports a refund, so callers can
 * avoid double-refunding on a retry.
 */
export async function hasRefundSucceeded(paymentId: string): Promise<boolean> {
  try {
    const payment = await fetchRazorpayPayment(paymentId);
    const status = (payment as { refund_status?: string }).refund_status;
    return status === "refunded" || status === "partial_refunded";
  } catch {
    return false;
  }
}
