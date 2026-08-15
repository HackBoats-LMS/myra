import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CUSTOMER" | "DELIVERY" | "MULTI_WORKER";
      canManageInventory: boolean;
      canManageShipping: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "CUSTOMER" | "DELIVERY" | "MULTI_WORKER";
    canManageInventory: boolean;
    canManageShipping: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CUSTOMER" | "DELIVERY" | "MULTI_WORKER";
    canManageInventory: boolean;
    canManageShipping: boolean;
  }
}
