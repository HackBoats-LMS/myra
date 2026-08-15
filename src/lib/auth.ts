import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { mergeGuestCart } from "@/actions/cart";
import { mergeGuestWishlist } from "@/actions/wishlist";

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
      async authorize(credentials) {
        if (!credentials?.phoneOrEmail || !credentials?.password) {
          throw new Error("Missing credentials");
        }

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

        if (!user.password) {
          throw new Error("This account was created with Google. Please sign in with Google.");
        }

        if (user.isDisabled) {
          throw new Error("Your account has been disabled. Please contact support.");
        }

        if (!user.phoneNumber && user.email && !user.emailVerified) {
          throw new Error("Please verify your email address before logging in.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
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
