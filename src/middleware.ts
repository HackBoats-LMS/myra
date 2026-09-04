import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildCspHeader(nonce: string, isProduction: boolean): string {
  const scriptSrc = isProduction
    ? `script-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com https://*.razorpay.com`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com https://*.googleusercontent.com https://*.razorpay.com",
    "font-src 'self' https://cdn.jsdelivr.net data:",
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

function addSecurityHeaders(response: NextResponse, nonce: string, isProduction: boolean) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce, isProduction));
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=*");
  response.headers.set("X-CSP-Nonce", nonce);
  return response;
}

async function verifyAuth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token;
}

export default async function middleware(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const nonce = generateNonce();
  const { pathname } = req.nextUrl;

  const authPaths = ["/admin", "/worker", "/account"];
  const shouldAuth = authPaths.some((path) => pathname.startsWith(path));

  if (shouldAuth) {
    const token = await verifyAuth(req);

    if (!token) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      return addSecurityHeaders(response, nonce, isProduction);
    }

    if (token.role === undefined || token.tokenVersion === undefined) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      return addSecurityHeaders(response, nonce, isProduction);
    }

    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      const response = NextResponse.redirect(new URL("/", req.url));
      return addSecurityHeaders(response, nonce, isProduction);
    }

    if (pathname.startsWith("/worker") && token.role !== "ADMIN" && token.role !== "MULTI_WORKER") {
      const response = NextResponse.redirect(new URL("/", req.url));
      return addSecurityHeaders(response, nonce, isProduction);
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response, nonce, isProduction);
}

export const config = {
  matcher: ["/:path*"],
};