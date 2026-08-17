import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function verifyRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // No extra DB query needed: the NextAuth `session` callback already re-reads
  // the user's role (and disabled state) fresh from the DB on every
  // getServerSession call, so admin demotions and account disables take effect
  // immediately. Relying on session.user.role avoids a redundant round-trip on
  // every authenticated action, which was a major source of latency.
  const role = session.user.role;

  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized");
  }

  return { ...session.user, role };
}

export async function verifyAdmin() {
  return verifyRole(["ADMIN"]);
}

export async function verifyUser() {
  const user = await verifyRole(["CUSTOMER", "ADMIN", "DELIVERY", "MULTI_WORKER"]);
  return user.id;
}

export async function verifyDeliveryAgent() {
  return verifyRole(["DELIVERY", "ADMIN"]);
}

export async function verifyMultiWorker() {
  return verifyRole(["MULTI_WORKER", "ADMIN"]);
}

export async function verifyAdminOrWorker() {
  return verifyRole(["ADMIN", "MULTI_WORKER"]);
}

export async function verifyWorkerCapability(capability: "inventory" | "shipping") {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  const { role, canManageInventory, canManageShipping } = session.user;

  // Capabilities are re-read fresh from the DB in the NextAuth `session`
  // callback on every getServerSession, so no extra DB query is needed here.
  if (role === "ADMIN") {
    return session.user;
  }
  if (role !== "MULTI_WORKER") {
    throw new Error("You do not have permission to perform this action.");
  }

  const hasCapability =
    capability === "inventory"
      ? (canManageInventory ?? false)
      : (canManageShipping ?? false);

  if (!hasCapability) {
    throw new Error("You do not have permission to perform this action.");
  }
  return session.user;
}