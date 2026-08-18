import AdminShell from "@/app/(admin)/admin/_components/AdminShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Secure the admin routes
  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
