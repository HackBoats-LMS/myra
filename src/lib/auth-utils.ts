import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

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
  const user = await verifyRole(["CUSTOMER", "ADMIN", "DELIVERY"]);
  return user.id;
}

export async function verifyDeliveryAgent() {
  return verifyRole(["DELIVERY", "ADMIN"]);
}