# Myra E-Commerce — Complete Project Roadmap & Progress

> **For**: Anyone picking up this codebase. This document is the single source of truth for what has been built, what works, what's incomplete, and what's still needed to ship this to a real paying client.

> **Stack**: Next.js 16 (App Router + Turbopack) · TypeScript · Tailwind CSS v4 · Prisma ORM · Supabase Postgres · Supabase Storage · NextAuth.js v4 · bcryptjs · lucide-react

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
- [ ] Environment variable validation (e.g. with `zod` or `t3-env`) — currently raw `process.env` with no checks at startup.
- [ ] Error monitoring service (Sentry, LogRocket, or similar).
- [ ] CI/CD pipeline (GitHub Actions for lint, typecheck, build).
- [ ] Production deployment (Vercel, Railway, or similar).
- [ ] Staging environment for testing before production pushes.

---

## 2. Database Schema & Migrations

**File**: `prisma/schema.prisma`

- [x] `User` model — id, email, phoneNumber, password (hashed), name, role (ADMIN/CUSTOMER), address fields (addressLine1, city, state, postalCode, country).
- [x] `Product` model — name, slug (unique), description, price (Float), stockQuantity, sku (optional unique), images (String[]), collectionId relation.
- [x] `Collection` model — name (unique), slug (unique), description.
- [x] `Order` / `OrderItem` models — userId, status (enum), totalAmount, paymentMethod (enum), price-at-purchase snapshot.
- [x] `Cart` / `CartItem` models — userId (unique), compound unique on [cartId, productId], cascade deletes.
- [x] `Wishlist` / `WishlistItem` models — userId (unique), compound unique on [wishlistId, productId], cascade deletes.
- [x] `Review` model — userId, productId, rating (Int), comment. **Note: schema exists but no UI or API has been built for reviews.**
- [x] Enums: `Role`, `OrderStatus` (PENDING/SHIPPED/DELIVERED/CANCELLED), `PaymentMethod` (RAZORPAY/CASH_ON_DELIVERY).
- [ ] Proper Prisma migration history (`prisma migrate`) — currently using `prisma db push` which is not suitable for production.
- [ ] Database indexes on frequently queried columns (e.g. `Order.userId`, `Product.collectionId`).
- [ ] Soft deletes on Products and Users (archived/deleted flag instead of hard delete).
- [ ] `Coupon` / `Discount` model.
- [ ] `Address` model (separate from User, to support multiple shipping addresses per user).
- [ ] Product variants model (size, color, material as separate SKUs).

---

## 3. Authentication & Authorization

**Files**: `src/lib/auth.ts`, `src/app/api/auth/register/route.ts`, `src/app/(auth)/`

- [x] NextAuth.js v4 with JWT session strategy.
- [x] `CredentialsProvider` supporting login via Email OR Phone Number + Password.
- [x] `GoogleProvider` configured in code (client ID/secret read from env).
- [x] Registration API route (`POST /api/auth/register`) — creates user with hashed password via bcrypt.
- [x] Login page (`/login`) with styled form.
- [x] Signup page (`/signup`) with styled form.
- [x] JWT callbacks injecting `user.id` and `user.role` into the session token.
- [x] Admin route protection — `(admin)/layout.tsx` checks `session.user.role === 'ADMIN'` and redirects to `/admin/login`.
- [x] Account page protection — `/account` redirects unauthenticated users to `/login`.
- [~] Google OAuth — provider is configured in code but **has not been tested with real Google credentials**. No `signIn("google")` button exists on the login page.
- [ ] OTP / SMS verification for phone number logins.
- [ ] Email verification flow (send verification email on signup, verify before allowing login).
- [ ] "Forgot Password" / password reset flow.
- [ ] Rate limiting on login and registration endpoints to prevent brute-force attacks.
- [ ] CSRF protection review for Server Actions.
- [ ] Proper TypeScript types for the session (currently using `(session.user as any).id` everywhere).

---

## 4. Admin Portal (`/admin`)

**Files**: `src/app/(admin)/`, `src/components/admin/`, `src/actions/admin.ts`

### Dashboard
- [~] Admin dashboard page (`/admin`) exists but **shows hardcoded "0" values**. No real analytics queries.
- [ ] Live stats: total orders, total revenue, total products, total customers.
- [ ] Revenue chart (daily/weekly/monthly).
- [ ] Top-selling products list.
- [ ] Low-stock alerts.
- [ ] Recent orders feed.

### Product Management
- [x] Product listing table with name, collection, price, stock badge.
- [x] Create product form with name, slug, description, price, stock, collection selector, image upload.
- [x] Edit product form (pre-populated).
- [x] Delete product with confirmation.
- [x] Image upload to Supabase Storage via `service_role` key (bypasses RLS).
- [x] Server-side input validation with type coercion and length limits.
- [~] Image upload generates random filenames (`Math.random()`) — **no UUID, no content-type validation, no file size limit enforcement on the server**.
- [ ] Multiple image uploads per product (currently only 1 image).
- [ ] Image reordering / gallery management.
- [ ] Bulk actions (bulk delete, bulk update stock).

### Collection Management
- [x] Collection listing table.
- [x] Create / Edit / Delete collection forms.
- [~] Collection create/update actions **lack the same input validation** that was applied to products (raw `as string` casts).
- [ ] Collection image/banner (currently collections have no visual identity).

### Order Management
- [x] Order listing table with customer name, item count, total, status.
- [x] Order detail page with all line items, quantities, and prices.
- [x] Status update dropdown (PENDING → SHIPPED → DELIVERED / CANCELLED).
- [ ] Order notes / internal comments.
- [ ] Print invoice / packing slip.
- [ ] Refund / partial refund handling.
- [ ] Export orders to CSV/Excel.

### Customer Management
- [ ] Customer listing table (name, email, phone, order count, total spend).
- [ ] Individual customer detail page.
- [ ] Ability to disable/ban accounts.

---

## 5. Storefront — Pages & UI

**Files**: `src/app/(storefront)/`, `src/components/storefront/`, `src/components/layout/`

### Layout
- [x] Global Navbar with logo, dynamic collection links (pulled from DB), Account/Cart/Wishlist icons.
- [x] Session-aware account icon (routes to `/account` if logged in, `/login` if not).
- [x] Footer with shop links, support links, legal links.
- [ ] Mobile hamburger menu — **Navbar is `hidden md:flex` for links, meaning mobile users cannot navigate collections**.
- [ ] Cart item count badge on the shopping bag icon.
- [ ] Search bar in Navbar.
- [ ] Announcement bar (e.g. "Free shipping on orders over ₹999").

### Homepage
- [x] HeroGrid component — 3-panel asymmetric banner layout with promotional images.
- [x] CategoryShowcase — horizontal scrollable collection cards.
- [x] "New Arrivals" section showing latest 4 products.
- [ ] "Best Sellers" section.
- [ ] "Sale / Deals" section.
- [ ] Newsletter signup form.
- [ ] Testimonials / social proof section.

### Product Browsing
- [x] `/collections` — all collections page.
- [x] `/collections/[slug]` — single collection with product grid.
- [x] `/products/[slug]` — product detail page with image, price, description, "Add to Bag" button, stock status.
- [ ] Product image gallery (multiple images, thumbnails, zoom).
- [ ] Product size/color/variant selector.
- [ ] "Related Products" or "You May Also Like" section.
- [ ] Product filtering (by price range, in stock only).
- [ ] Product sorting (price low-high, high-low, newest, name A-Z).
- [ ] Pagination or infinite scroll on collection pages (currently loads all products).
- [ ] Breadcrumb navigation.
- [ ] "Recently Viewed" products.

### Customer Reviews & Ratings
- [~] `Review` model exists in the database schema.
- [ ] Review submission form on product detail page.
- [ ] Star rating display on product cards and detail pages.
- [ ] Average rating calculation.
- [ ] Admin moderation for reviews.

### Search
- [ ] Search page (`/search?q=...`).
- [ ] Full-text search across product names and descriptions.
- [ ] Auto-suggest / live search in Navbar.
- [ ] Search results with filtering and sorting.

---

## 6. Shopping Cart

**Files**: `src/actions/cart.ts`, `src/app/(storefront)/cart/page.tsx`, `src/components/storefront/CartItem.tsx`, `src/components/storefront/CheckoutButton.tsx`

### Logged-In Cart (Database)
- [x] Add to cart (creates Cart if not exists, upserts CartItem).
- [x] Update quantity.
- [x] Remove item (set quantity to 0).
- [x] Cart page UI with line items, quantities, subtotal, order summary.

### Guest Cart (Cookie)
- [x] Cookie-based cart for unauthenticated users.
- [x] Strict payload shape validation (type checks on productId and quantity).
- [x] Anti-abuse limits: max 50 unique items, max 99 per item quantity.
- [ ] Merge guest cart into user cart on login (currently guest cart is abandoned on login).

### Cart UX
- [x] "Add to Bag" button on product detail pages with loading spinner.
- [~] Success feedback uses `alert("Added to cart!")` — **should be a toast notification**.
- [ ] Cart drawer / slide-out panel (instead of navigating to a full page).
- [ ] "Continue Shopping" link on cart page.
- [ ] Save for later / move to wishlist from cart.
- [ ] Estimated delivery date.
- [ ] Coupon / promo code input field.

---

## 7. Wishlist

**Files**: `src/actions/wishlist.ts`, `src/app/(storefront)/wishlist/page.tsx`, `src/components/storefront/WishlistButton.tsx`

- [x] Toggle wishlist (add/remove) via Server Action.
- [x] Heart icon on product cards.
- [x] Dedicated wishlist page showing saved products.
- [ ] "Move to Cart" button from wishlist.
- [ ] Wishlist for guest users (currently requires login).
- [ ] Wishlist sharing (shareable link).

---

## 8. Checkout & Payments

**Files**: `src/actions/cart.ts` (`checkoutCart`)

- [x] Atomic checkout using `prisma.$transaction`.
- [x] Stock validation — checks `stockQuantity >= item.quantity` before order creation.
- [x] Automatic stock decrement after successful order.
- [x] Order creation with PENDING status and CASH_ON_DELIVERY payment method.
- [x] Cart emptied after successful checkout.
- [~] Checkout is a single button click with no address confirmation step — **skips straight from cart to order**.
- [ ] Multi-step checkout flow (Shipping Address → Payment Method → Order Review → Confirm).
- [ ] Shipping address selection from saved addresses (or add new).
- [ ] Payment gateway integration (Razorpay).
- [ ] Payment webhook verification before confirming order.
- [ ] Order confirmation page with order summary.
- [ ] Shipping cost calculation (currently shows "Complimentary").
- [ ] Tax calculation (GST/IGST).
- [ ] Apply coupon/discount codes at checkout.

---

## 9. Customer Account (`/account`)

**Files**: `src/app/(storefront)/account/page.tsx`, `src/components/storefront/ProfileForm.tsx`, `src/actions/user.ts`

- [x] Profile form — update name, email, address (addressLine1, city, state, postalCode, country).
- [x] Server-side validation with type coercion and length limits.
- [x] Order history with status badges, line items, and totals.
- [x] Sign out button.
- [ ] Change password functionality.
- [ ] Multiple saved addresses (add/edit/delete/set default).
- [ ] Order detail page (click into a specific order from account).
- [ ] Order cancellation request.
- [ ] Download invoice PDF.
- [ ] Account deletion.

---

## 10. Transactional Emails & Notifications

- [ ] Email service integration (Resend, SendGrid, or AWS SES).
- [ ] Welcome email on registration.
- [ ] Order confirmation email with order summary.
- [ ] Shipping notification email with tracking link.
- [ ] Delivery confirmation email.
- [ ] Password reset email.
- [ ] Low-stock alert email to admin.
- [ ] Abandoned cart recovery email.
- [ ] SMS notifications via Twilio (optional).

---

## 11. SEO & Performance

- [~] Next.js `Image` component used everywhere with `fill`, `sizes`, and `priority` props.
- [ ] Dynamic `<title>` and `<meta description>` tags per page (currently using Next.js defaults).
- [ ] OpenGraph and Twitter Card meta tags for social sharing.
- [ ] Structured data / JSON-LD (Product schema for Google rich results).
- [ ] XML sitemap generation (`/sitemap.xml`).
- [ ] `robots.txt` configuration.
- [ ] Canonical URLs.
- [ ] Static generation (ISR) for product and collection pages.
- [ ] Loading skeletons / Suspense boundaries for server components.
- [ ] Web Vitals monitoring.

---

## 12. Security (Backend Hardening)

- [x] Admin actions protected by `verifyAdmin()` session check.
- [x] Atomic transactions prevent overselling.
- [x] Input validation on `updateUserProfile`, `createProduct`, `updateProduct` (length limits, type coercion).
- [x] Guest cart cookie parsing with strict shape validation and size limits.
- [x] Passwords hashed with bcrypt (cost factor 10).
- [x] Next.js 15+ async params properly awaited on all dynamic routes.
- [~] Collection CRUD actions (`createCollection`, `updateCollection`) still use raw `as string` casts — **not yet hardened**.
- [ ] Zod schema validation across all Server Actions (proper error messages, not just truncation).
- [ ] Rate limiting on API routes (login, register, checkout).
- [ ] CORS configuration.
- [ ] Content Security Policy (CSP) headers.
- [ ] HTTP-only, Secure, SameSite cookie attributes on auth tokens.
- [ ] SQL injection audit (Prisma provides parameterized queries by default, but raw queries need review).
- [ ] File upload validation (allowed MIME types, max file size).
- [ ] Admin action audit logging.

---

## 13. Legal & Compliance Pages

- [ ] Privacy Policy page (`/privacy`).
- [ ] Terms of Service page (`/terms`).
- [ ] Refund & Return Policy page (`/returns`).
- [ ] Shipping Policy page (`/shipping`).
- [ ] Cookie consent banner (GDPR/CCPA compliance).
- [ ] Contact Us page with form.
- [ ] About Us page.
- [ ] FAQ page.

---

## 14. Mobile Responsiveness & PWA

- [~] Pages use Tailwind responsive classes but **Navbar drops all navigation links on mobile** (no hamburger menu).
- [ ] Full mobile audit and QA pass across all pages.
- [ ] Touch-friendly interaction targets (buttons, links).
- [ ] Mobile-optimized checkout flow.
- [ ] Progressive Web App (PWA) manifest and service worker.
- [ ] App icon and splash screen.

---

## 15. Testing & Quality

- [ ] Unit tests for Server Actions (cart, checkout, admin).
- [ ] Integration tests for API routes (registration, auth).
- [ ] End-to-end tests (Playwright or Cypress) for critical flows (browse → add to cart → checkout).
- [ ] Accessibility audit (WCAG 2.1 AA compliance).
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge).
- [ ] Load testing / stress testing for checkout under concurrent users.

---

## 16. DevOps & Deployment

- [ ] Production build validation (`next build` passes cleanly).
- [ ] Environment variables documented in `.env.example`.
- [ ] Vercel deployment configuration (or alternative: Railway, Fly.io).
- [ ] Custom domain setup and SSL.
- [ ] CDN configuration for static assets.
- [ ] Database backup strategy.
- [ ] Monitoring and alerting (uptime, error rates, response times).
- [ ] Log aggregation.

---

## Known Bugs & Tech Debt

1. **Admin dashboard shows hardcoded zeros** — needs real Prisma aggregate queries.
2. **`alert()` used for cart feedback** — should be replaced with toast notifications.
3. **No mobile navigation** — Navbar collection links are hidden on mobile with no hamburger menu alternative.
4. **Image filenames use `Math.random()`** — should use UUID or content-hash for uniqueness.
5. **Collection actions not input-validated** — `createCollection` and `updateCollection` use raw `as string`.
6. **Session types use `as any` casts** — should extend NextAuth types properly.
7. **Guest cart not merged on login** — items added as guest are lost when user logs in.
8. **No pagination anywhere** — product listings, order listings, admin tables all load everything.
9. **`price` stored as Float** — should be `Int` (store in paise/cents) to avoid floating-point rounding errors in currency math.
10. **No loading states on Server Components** — pages show nothing until fully rendered.

---

*Last updated: August 8, 2026*
