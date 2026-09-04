import crypto from "crypto";

const SECRET: string = process.env.COOKIE_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || "";
if (!SECRET) {
  throw new Error(
    "Missing COOKIE_SIGNING_SECRET or NEXTAUTH_SECRET. " +
    "Set at least one to enable cookie integrity verification."
  );
}

if (!process.env.COOKIE_SIGNING_SECRET && process.env.NEXTAUTH_SECRET) {
  console.warn(
    "[SECURITY] COOKIE_SIGNING_SECRET is not set — falling back to NEXTAUTH_SECRET for cookie signing. " +
    "For defence-in-depth, set a dedicated COOKIE_SIGNING_SECRET in production."
  );
}

/**
 * Sign a guest cart/wishlist cookie value with HMAC-SHA256 to prevent tampering.
 * Format: `data.signature`
 */
export function signCookieValue(data: string): string {
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

/**
 * Verify and extract the original data from a signed cookie value.
 * Returns null if the signature is invalid or the cookie was tampered with.
 */
export function verifyCookieValue(signedValue: string | undefined): string | null {
  if (!signedValue) return null;

  const lastDot = signedValue.lastIndexOf(".");
  if (lastDot === -1) return null;

  const data = signedValue.substring(0, lastDot);
  const providedSig = signedValue.substring(lastDot + 1);

  const expectedSig = crypto.createHmac("sha256", SECRET).update(data).digest("hex");

  // Timing-safe comparison to prevent timing attacks
  const a = Buffer.from(providedSig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return data;
}
