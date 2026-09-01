import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export async function requireWorkerModule(module: "inventory" | "shipping") {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "MULTI_WORKER" && session.user.role !== "ADMIN")) {
    redirect("/worker/login");
  }

  if (session.user.role === "ADMIN") {
    return session.user;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { canManageInventory: true, canManageShipping: true },
  });

  const allowed =
    module === "inventory" ? dbUser?.canManageInventory ?? false : dbUser?.canManageShipping ?? false;

  if (!allowed) {
    redirect("/worker");
  }
  return session.user;
}
