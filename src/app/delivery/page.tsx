import { getDeliveryOrders } from "@/actions/delivery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeliveryDashboard from "@/components/delivery/DeliveryDashboard";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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
      <div className="max-w-md mx-auto my-20 p-8 bg-white border border-gray-200 rounded-lg shadow-sm text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-sm text-gray-500">
          Your account does not have delivery agent permissions. If you believe this is an error, contact your administrator.
        </p>
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-[#0D3B66] hover:underline">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Return to Storefront
        </Link>
      </div>
    );
  }

  // Fetch initial active delivery orders
  const orders = await getDeliveryOrders();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 min-h-screen space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 tracking-tight">Delivery Partner Portal</h1>
        <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest">Logged in as {session.user.email} ({role.toLowerCase()})</p>
      </div>

      <DeliveryDashboard initialOrders={orders} />
    </div>
  );
}
