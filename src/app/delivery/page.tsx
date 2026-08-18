import { getDeliveryOrders } from "@/actions/admin/delivery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import DeliveryDashboard from "@/app/delivery/_components/DeliveryDashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delivery Dashboard | Myra Partner",
};

export default async function DeliveryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/delivery");
  }

  const role = session.user.role;
  if (role !== "DELIVERY" && role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-[#B6925B]/20 text-center space-y-4 rounded-none">
        <h2 className="text-xl font-serif text-red-600">Access Denied</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          Your account does not have delivery agent permissions. If you believe this is an error, contact your administrator.
        </p>
        <Link href="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors rounded-none gap-1">
          <i className="ri-arrow-left-line text-sm" />
          Return to Storefront
        </Link>
      </div>
    );
  }

  // Fetch initial active delivery orders
  const orders = await getDeliveryOrders();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 min-h-screen space-y-8">
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">Delivery Partner Portal</h1>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Logged in as {session.user.email} ({role.toLowerCase()})</p>
      </div>

      <DeliveryDashboard initialOrders={orders} />
    </div>
  );
}
