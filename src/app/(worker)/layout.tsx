import WorkerShell from "@/components/worker/WorkerShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "MULTI_WORKER" && session.user.role !== "ADMIN")) {
    redirect("/worker/login");
  }

  // Read capabilities fresh from the DB so admin changes apply immediately
  // without requiring the worker to log out and back in.
  let canInventory = session.user.role === "ADMIN";
  let canShipping = session.user.role === "ADMIN";

  if (session.user.role !== "ADMIN") {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canManageInventory: true, canManageShipping: true },
    });
    canInventory = dbUser?.canManageInventory ?? false;
    canShipping = dbUser?.canManageShipping ?? false;
  }

  return (
    <WorkerShell canInventory={canInventory} canShipping={canShipping}>
      {children}
    </WorkerShell>
  );
}