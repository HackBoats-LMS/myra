import Sidebar from "@/components/admin/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Secure the admin routes
  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-white border-b border-[#B6925B]/20 flex items-center px-8 shadow-sm">
          <h1 className="text-xs font-bold text-[#4A3B2C] tracking-widest uppercase">
            Welcome back, Admin
          </h1>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
