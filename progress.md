# Myra E-Commerce — Complete Project Roadmap & Progress

> **For**: Anyone picking up this codebase. This document is the single source of truth for what has been built, what works, what's incomplete, and what's still needed to ship this to a real paying client.

> **Stack**: Next.js 16 (App Router + Turbopack) · TypeScript · Tailwind CSS v4 · Prisma ORM · Supabase Postgres · Supabase Storage · NextAuth.js v4 · bcryptjs · Resend (email)

---

## How to Read This

- `[x]` = **Done and working** in the codebase right now.
- `[~]` = **Partially done** — code exists but is incomplete, hardcoded, or has known issues.
- `[ ]` = **Not started** — no code exists for this yet.

---

## 1. Project Foundation & Infrastructure

- [x] Next.js 16.3.0 project with App Router and Turbopack.
- [x] TypeScript configured with strict mode.
- [x] Tailwind CSS v4 for styling.
- [x] Prisma ORM with `@prisma/adapter-pg` driver adapter for Supabase.
- [x] Supabase Postgres as the production database.
- [x] Supabase Storage bucket (`product-images`) for media uploads.
- [x] `next.config.ts` configured with Supabase remote image patterns.
- [x] Global connection pool caching in `src/lib/prisma.ts` to prevent HMR connection exhaustion.
- [x] Environment variable validation at startup (`src/lib/env.ts`).

---

## 2. Database Schema & Migrations

**File**: `prisma/schema.prisma`

- [x] `User` model — id, email, phoneNumber, password (hashed), name, role (ADMIN/CUSTOMER), address fields.
- [x] `Product` model — name, slug (unique), description, price (Float), stockQuantity, sku, images (String[]), collectionId.
- [x] `Collection` model — name (unique), slug (unique), description, image (banner).
- [x] `Order` / `OrderItem` models — userId, status (enum), totalAmount, paymentMethod, price-at-purchase snapshot.
- [x] `Cart` / `CartItem` models — userId (unique), cascade deletes, `reminderSentAt` for abandoned cart.
- [x] `Wishlist` / `WishlistItem` models — userId (unique), cascade deletes.
- [x] `Review` model — userId, productId, rating (Int), comment.
- [x] `Coupon` / `Discount` model — code, discountType, discountValue, minOrderAmount, maxUses, expiresAt.
- [x] `Address` model — multiple shipping addresses per user with default flag.
- [x] `ProductVariant` model — size, color, stockQuantity, priceOffset.
- [x] `AuditLog` model — actorId, action, entity, entityId, meta, createdAt.
- [x] Enums: `Role`, `OrderStatus` (PENDING/SHIPPED/DELIVERED/CANCELLED), `PaymentMethod`.
- [x] Database indexes on frequently queried columns.
- [x] Soft deletes on Products and Users.

---

## 3. Authentication & Authorization

**Files**: `src/lib/auth.ts`, `src/app/api/auth/register/route.ts`, `src/app/(auth)/`

- [x] NextAuth.js v4 with JWT session strategy.
- [x] `CredentialsProvider` supporting login via Email OR Phone Number + Password.
- [x] `GoogleProvider` configured — "Sign in with Google" button present on login page.
- [x] Registration API route (`POST /api/auth/register`) — creates user with hashed password via bcrypt.
- [x] Login page (`/login`) with credentials form and Google OAuth button.
- [x] Signup page (`/signup`) with styled form.
- [x] JWT callbacks injecting `user.id` and `user.role` into the session token.
- [x] Admin route protection — `(admin)/layout.tsx` checks `session.user.role === 'ADMIN'`.
- [x] Account page protection — `/account` redirects unauthenticated users to `/login`.
- [x] "Forgot Password" / password reset flow.
- [x] Rate limiting on login and registration endpoints (in-memory, with cleanup).
- [x] CSRF protection for Server Actions.
- [ ] OTP / SMS verification for phone number logins. *(Skipped — requires paid SMS provider)*

---

## 4. Admin Portal (`/admin`)

**Files**: `src/app/(admin)/`, `src/components/admin/`, `src/actions/admin.ts`

### Dashboard
- [x] Live stats: total orders, total revenue, total products, total customers.
- [x] Revenue chart (daily/weekly/monthly).
- [x] Top-selling products list.
- [x] Low-stock alerts.
- [x] Recent orders feed.

### Product Management
- [x] Product listing table with name, collection, price, stock badge.
- [x] Create / Edit / Delete product forms.
- [x] Image upload to Supabase Storage (UUID filenames, MIME/size validation, up to 5 images).
- [x] Image reordering via hover chevron buttons (left/right swap).
- [x] Bulk delete and bulk stock update actions.
- [x] Server-side input validation with Zod.

### Collection Management
- [x] Collection listing table.
- [x] Create / Edit / Delete collection forms.
- [x] Collection banner image upload (displayed as hero on storefront collection pages).

### Order Management
- [x] Order listing table with customer name, item count, total, status.
- [x] Order detail page with all line items, quantities, and prices.
- [x] Status update dropdown (PENDING → SHIPPED → DELIVERED / CANCELLED).
- [x] Order notes / internal comments.
- [x] Print invoice / packing slip.
- [x] Refund / partial refund handling.
- [x] Export orders to CSV.

### Customer Management
- [x] Customer listing table (name, email, phone, order count, total spend).
- [x] Individual customer detail page.
- [x] Ability to disable/ban accounts.

### Audit Logs
- [x] Admin action audit log (`/admin/audit-logs`) — records actor, action, entity, timestamp.
- [x] `logAudit()` wired into product, order, coupon, review, and delivery actions.

---

## 5. Storefront — Pages & UI

**Files**: `src/app/(storefront)/`, `src/components/storefront/`, `src/components/layout/`

### Layout
- [x] Global Navbar with logo, dynamic collection links, Account/Cart/Wishlist icons.
- [x] Session-aware account icon (routes to `/account` if logged in, `/login` if not).
- [x] Footer with shop links, support links, legal links.
- [x] Mobile hamburger menu — full slide-down panel with search, shop links, account links.
- [x] Cart item count badge on the shopping bag icon.
- [x] Live search bar in Navbar with auto-suggest dropdown.
- [x] Announcement bar (e.g. "Free shipping on orders over ₹999").
- [x] Skip-to-content link for keyboard/screen-reader accessibility.
- [x] Cookie consent banner (GDPR/CCPA).

### Homepage
- [x] HeroGrid — 3-panel asymmetric banner layout.
- [x] CategoryShowcase — horizontal scrollable collection cards.
- [x] "New Arrivals", "Best Sellers", "Sale / Deals" sections.
- [x] Newsletter signup form.
- [x] Testimonials / social proof section.
- [x] Organization JSON-LD structured data.
- [x] ISR — revalidated every 1 hour (`export const revalidate = 3600`).

### Product Browsing
- [x] `/collections` — all collections page (ISR, 1 hour).
- [x] `/collections/[slug]` — single collection with hero banner image + product grid (ISR, 1 hour).
- [x] `/products/[slug]` — product detail with image gallery, price, variants, "Add to Bag".
- [x] Product JSON-LD structured data (Product schema for Google Rich Results).
- [x] Product image gallery with thumbnails and zoom.
- [x] Product size/color/variant selector.
- [x] "Related Products" section.
- [x] Product filtering (price range, in-stock only) and sorting (price, name, newest).
- [x] Pagination on collection pages.
- [x] Breadcrumb navigation with JSON-LD BreadcrumbList schema.
- [x] "Recently Viewed" products.

### Customer Reviews & Ratings
- [x] Review submission form on product detail page.
- [x] Star rating display on product cards and detail pages.
- [x] Average rating calculation.
- [x] Admin moderation for reviews.

### Search
- [x] Search page (`/search?q=...`) with full-text search.
- [x] Auto-suggest / live search in Navbar.
- [x] Search results with filtering and sorting controls.

---

## 6. Shopping Cart

- [x] Add to cart, update quantity, remove item.
- [x] Cart page UI with line items, quantities, subtotal, order summary.
- [x] Cookie-based cart for guest users (max 50 items, max 99 qty, 30-day expiry).
- [x] Guest cart merges into user cart on login.
- [x] Cart drawer / slide-out panel.
- [x] Save for later / move to wishlist from cart.
- [x] Coupon / promo code input at checkout.
- [x] Estimated delivery date display.

---

## 7. Wishlist

- [x] Toggle wishlist (add/remove) via Server Action.
- [x] Heart icon on product cards.
- [x] Dedicated wishlist page showing saved products.
- [x] "Move to Cart" button from wishlist.
- [x] Guest wishlist (cookie-based, 30-day expiry, max 100 items).
- [x] Guest wishlist merges into DB on login.

---

## 8. Checkout & Payments

- [x] Atomic checkout using `prisma.$transaction`.
- [x] Stock validation and automatic stock decrement.
- [x] Order creation with PENDING status.
- [x] Shipping address selection from saved addresses.
- [x] Apply coupon/discount codes at checkout.
- [x] Pricing logic extracted to `src/lib/pricing.ts` (pure, reusable, tested).
- [x] Cash on Delivery payment method.
- [x] Order confirmation landing page after checkout.
- [ ] **Razorpay payment gateway** *(not built — requires Razorpay API keys)*
- [ ] Payment webhook verification.

---

## 9. Customer Account (`/account`)

- [x] Profile form — update name, email, address.
- [x] Order history with status badges, line items, and totals.
- [x] Change password functionality.
- [x] Multiple saved addresses (add/edit/delete/set default).
- [x] Order detail page.
- [x] Order cancellation request.
- [x] Download invoice / print receipt.
- [x] Account deletion.

---

## 10. Transactional Emails

**Provider**: Resend (`src/lib/email.ts`) — falls back to console mock if `RESEND_API_KEY` is not set.

- [x] Welcome email on registration.
- [x] Email verification flow (token-based, sent on signup).
- [x] Order confirmation email with full order summary.
- [x] Shipping notification email.
- [x] Delivery confirmation email.
- [x] Password reset email.
- [x] Low-stock alert email to admin.
- [x] Abandoned cart recovery email (cron job at `/api/cron/abandoned-cart`).

---

## 11. SEO & Performance

- [x] Dynamic `<title>` and `<meta description>` per page.
- [x] OpenGraph and Twitter Card meta tags.
- [x] Product JSON-LD schema (Google Rich Results).
- [x] Organization JSON-LD schema on homepage.
- [x] BreadcrumbList JSON-LD on collection and product pages.
- [x] XML sitemap (`/sitemap.xml`).
- [x] `robots.txt` configuration.
- [x] Canonical URLs.
- [x] ISR (`revalidate = 3600`) on homepage, all-collections, and collection slug pages.
- [x] Web Vitals monitoring (`src/components/WebVitals.tsx`) — logs CLS, FID, LCP, FCP, TTFB, INP.
- [x] Loading skeletons / Suspense boundaries on key pages.

---

## 12. Security

- [x] Admin actions protected by `verifyAdmin()` session check.
- [x] Atomic transactions prevent overselling.
- [x] Zod schema validation across all Server Actions.
- [x] Guest cart cookie parsing with strict shape validation and size limits.
- [x] Passwords hashed with bcrypt (cost factor 10).
- [x] Rate limiting on login, register, and checkout (in-memory with cleanup).
- [x] Content Security Policy (CSP) headers.
- [x] File upload validation (allowed MIME types, max file size, UUID filenames).
- [x] Admin action audit logging.

---

## 13. Legal & Compliance Pages

- [x] Privacy Policy (`/privacy`), Terms of Service (`/terms`), Refund & Return Policy (`/returns`).
- [x] Shipping Policy (`/shipping`), Contact Us (`/contact`), About Us (`/about`), FAQ (`/faq`).

---

## 14. Mobile Responsiveness & Accessibility

- [x] All pages use Tailwind responsive classes.
- [x] Mobile hamburger navigation menu (slide-down panel with all links).
- [x] Skip-to-content link (`<a href="#main-content">`) for keyboard users.
- [x] Semantic `<main id="main-content">` landmark in storefront layout.
- [x] `aria-label` on all icon-only buttons.
- [x] `focus:ring` visible focus styles on all interactive elements.

---

## Completed Bug Fixes

- **Admin dashboard shows hardcoded zeros** → Fixed. Queries real Prisma aggregated counts.
- **`alert()` used for cart feedback** → Fixed. Replaced with custom toast notification system.
- **No mobile navigation** → Fixed. Responsive hamburger slide-down menu fully implemented.
- **Image filenames use `Math.random()`** → Fixed. Uses `crypto.randomUUID()`.
- **Collection actions not validated** → Fixed. Zod validation + length limits implemented.
- **Guest cart not merged on login** → Fixed. Cart items automatically merge on sign-in.
- **Guest wishlist not supported** → Fixed. Cookie-based wishlist with 30-day expiry.
- **Collection pages had no banner image** → Fixed. Hero banner with gradient overlay on storefront.
- **Image reorder buttons used raw SVG** → Fixed. Now uses `@heroicons/react` with `aria-label`.
- **No skip-to-content link** → Fixed. Added visually-hidden focus-visible skip link.
- **Inline SVG icons in admin** → Fixed. All icons now use `@heroicons/react`.

---

*Last updated: August 12, 2026*
