import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function verifyRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
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
  const { role, id } = session.user;
  if (role === "ADMIN") {
    return session.user;
  }
  if (role !== "MULTI_WORKER") {
    throw new Error("You do not have permission to perform this action.");
  }

  // Read capabilities fresh from the DB so admin changes apply immediately.
  const dbUser = await prisma.user.findUnique({
    where: { id },
    select: { canManageInventory: true, canManageShipping: true },
  });

  const hasCapability =
    capability === "inventory"
      ? dbUser?.canManageInventory ?? false
      : dbUser?.canManageShipping ?? false;

  if (!hasCapability) {
    throw new Error("You do not have permission to perform this action.");
  }
  return session.user;
}