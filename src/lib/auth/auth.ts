import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { mergeGuestCart } from "@/actions/cart";
import { mergeGuestWishlist } from "@/actions/wishlist";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCookieValue } from "@/lib/cookie-signing";
import { CACHE_TAGS } from "@/lib/cache";
import { revalidateTag } from "next/cache";

// Lazy-init bcrypt hash used when an account has no password (e.g. Google-only).
// Avoids blocking the event loop at startup with bcrypt.hashSync.
let _dummyPasswordHash: string | null = null;
function getDummyPasswordHash(): string {
  if (!_dummyPasswordHash) {
    _dummyPasswordHash = bcrypt.hashSync("dummy-password-not-real", 12);
  }
  return _dummyPasswordHash;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phoneOrEmail: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.phoneOrEmail || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Rate-limit login attempts by IP and by account identifier.
        await checkRateLimit({
          bucket: "login:ip",
          key: getClientIp(req),
          limit: 15,
          windowSeconds: 900,
        });
        await checkRateLimit({
          bucket: "login:id",
          key: String(credentials.phoneOrEmail).toLowerCase(),
          limit: 10,
          windowSeconds: 900,
        });

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: credentials.phoneOrEmail },
              { email: credentials.phoneOrEmail }
            ]
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        // Always compare against a hash so timing is uniform whether or not the
        // account has a password, and never reveal account state before the
        // password is proven correct (prevents account enumeration).
        const hashToCheck = user.password ?? getDummyPasswordHash();
        const isPasswordValid = await bcrypt.compare(credentials.password, hashToCheck);

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        if (!user.password) {
          throw new Error("This account was created with Google. Please sign in with Google.");
        }

        if (user.isDisabled) {
          throw new Error("Your account has been disabled. Please contact support.");
        }

        if (!user.phoneNumber && user.email && !user.emailVerified) {
          throw new Error("Please verify your email address before logging in.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "ADMIN" | "CUSTOMER" | "MULTI_WORKER",
          canManageInventory: user.canManageInventory,
          canManageShipping: user.canManageShipping,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        
        // Find or create the user in our database
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              role: "CUSTOMER",
              emailVerified: new Date()
            }
          });
        } else if (!dbUser.emailVerified) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: new Date() }
          });
        }

        if (dbUser.isDisabled) {
          throw new Error("Your account has been disabled. Please contact support.");
        }

        // Mutate the user object so NextAuth picks up the DB record ID and Role instead of OAuth values
        user.id = dbUser.id;
        user.role = dbUser.role;
      }

      // Merge guest cookie cart into DB cart on login
      try {
        const cookieStore = await cookies();
        const guestCart = cookieStore.get("guest_cart");
        const rawCartData = guestCart?.value ? verifyCookieValue(guestCart.value) : undefined;
        if (rawCartData) {
          await mergeGuestCart(rawCartData);
          // Clear the guest cookie after merge
          cookieStore.delete("guest_cart");
        }
      } catch {
        // Non-fatal: don't block sign-in if merge fails
      }

      // Merge guest cookie wishlist into DB wishlist on login
      try {
        const cookieStore = await cookies();
        const guestWishlist = cookieStore.get("guest_wishlist");
        const rawWishlistData = guestWishlist?.value ? verifyCookieValue(guestWishlist.value) : undefined;
        if (rawWishlistData) {
          await mergeGuestWishlist(rawWishlistData);
          cookieStore.delete("guest_wishlist");
        }
      } catch {
        // Non-fatal: don't block sign-in if merge fails
      }

      // Refresh the header badge counts so they reflect the merged guest data
      // immediately instead of waiting for the cache TTL.
      try {
        if (user.id) {
          revalidateTag(CACHE_TAGS.cart(user.id), { expire: 0 });
          revalidateTag(CACHE_TAGS.wishlist(user.id), { expire: 0 });
        }
      } catch {
        // Non-fatal
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.canManageInventory = user.canManageInventory;
        token.canManageShipping = user.canManageShipping;
        // Fetch tokenVersion so middleware can reject stale sessions
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tokenVersion: true },
        });
        token.tokenVersion = dbUser?.tokenVersion ?? 0;
        token._tokenVersionCheckedAt = Date.now();
      }

      // Re-verify tokenVersion periodically (every 60 seconds) so disabled or
      // demoted users lose access quickly instead of waiting for JWT expiry.
      // This adds one lightweight DB query per minute per protected request.
      if (token.id && typeof token._tokenVersionCheckedAt === "number") {
        const elapsed = Date.now() - token._tokenVersionCheckedAt;
        if (elapsed > 60_000) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true, isDisabled: true },
          });
          if (!dbUser || dbUser.isDisabled) {
            // Throw to invalidate the session immediately
            throw new Error("Session invalidated");
          }
          if (dbUser.tokenVersion !== token.tokenVersion) {
            throw new Error("Session invalidated: token version mismatch");
          }
          token._tokenVersionCheckedAt = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.canManageInventory = token.canManageInventory;
        session.user.canManageShipping = token.canManageShipping;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
