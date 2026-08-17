import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { mergeGuestCart } from "@/actions/cart";
import { mergeGuestWishlist } from "@/actions/wishlist";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { normalizeIndianPhone } from "./phone";
import { CACHE_TAGS } from "./cache";
import { revalidateTag } from "next/cache";

// A fixed bcrypt hash used when an account has no password (e.g. Google-only),
// so the compare always runs and timing doesn't reveal whether a password exists.
const DUMMY_PASSWORD_HASH = "$2b$10$nDofhNs0/keiqBZ1Kw.UNug/yevi6H21OiA3nzxuRn3DFMWTKEqba";

export const authOptions: NextAuthOptions = {
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

        // Rate-limit login attempts by IP and by account identifier. The
        // account-identifier bucket always applies; the IP bucket is skipped
        // when no reliable per-client IP can be determined.
        const clientIp = getClientIp(req);
        if (clientIp) {
          await checkRateLimit({
            bucket: "login:ip",
            key: clientIp,
            limit: 15,
            windowSeconds: 900,
          });
        }
        const identifier = String(credentials.phoneOrEmail).trim().toLowerCase();
        await checkRateLimit({
          bucket: "login:id",
          key: identifier,
          limit: 10,
          windowSeconds: 900,
        });

        // Normalize the input the same way registration does, so a user who
        // registered with "+91 63010 67189" can sign in with that exact string
        // and emails match case-insensitively.
        const normalizedPhone = normalizeIndianPhone(identifier);
        const lowerEmail = identifier;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: normalizedPhone },
              { email: lowerEmail }
            ]
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        // Always compare against a hash so timing is uniform whether or not the
        // account has a password, and never reveal account state before the
        // password is proven correct (prevents account enumeration).
        const hashToCheck = user.password ?? DUMMY_PASSWORD_HASH;
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
          role: user.role,
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
        if (guestCart?.value && user.id) {
          await mergeGuestCart(user.id, guestCart.value);
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
        if (guestWishlist?.value && user.id) {
          await mergeGuestWishlist(user.id, guestWishlist.value);
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        // Re-read the user's current role/capabilities (and disabled state) from
        // the DB so admin demotions, capability revocations, and account
        // disables take effect immediately instead of being trusted from the
        // JWT until it expires. Throwing here invalidates the session lookup
        // for a disabled/deleted account.
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: {
              role: true,
              canManageInventory: true,
              canManageShipping: true,
              isDisabled: true,
            },
          });
          if (!dbUser || dbUser.isDisabled) {
            throw new Error("Unauthorized");
          }
          session.user.role = dbUser.role;
          session.user.canManageInventory = dbUser.canManageInventory;
          session.user.canManageShipping = dbUser.canManageShipping;
        } else {
          session.user.role = token.role;
          session.user.canManageInventory = token.canManageInventory;
          session.user.canManageShipping = token.canManageShipping;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
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
