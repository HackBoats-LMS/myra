import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function verifyRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  // Re-read the role fresh from the DB so admin demotions take effect
  // immediately, rather than relying on the role baked into the JWT at login.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const role = dbUser?.role ?? session.user.role;

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



export async function verifyWorkerCapability(capability: "inventory" | "shipping") {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  const { id } = session.user;

  // Re-read role and capabilities fresh from the DB so admin changes apply
  // immediately instead of relying on the (possibly stale) JWT.
  const dbUser = await prisma.user.findUnique({
    where: { id },
    select: { role: true, canManageInventory: true, canManageShipping: true },
  });
  const role = dbUser?.role ?? session.user.role;

  if (role === "ADMIN") {
    // Return fresh DB user data instead of potentially stale JWT data.
    const adminUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, canManageInventory: true, canManageShipping: true },
    });
    return adminUser ?? { ...session.user, role };
  }
  if (role !== "MULTI_WORKER") {
    throw new Error("You do not have permission to perform this action.");
  }

  const hasCapability =
    capability === "inventory"
      ? dbUser?.canManageInventory ?? false
      : dbUser?.canManageShipping ?? false;

  if (!hasCapability) {
    throw new Error("You do not have permission to perform this action.");
  }
  // Return fresh DB data instead of potentially stale JWT data.
  return { ...session.user, ...dbUser, id };
}
