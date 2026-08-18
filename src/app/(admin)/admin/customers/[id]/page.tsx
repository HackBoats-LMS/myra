import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CustomerHeader from "@/app/(admin)/admin/customers/[id]/_components/CustomerHeader";
import CustomerProfile from "@/app/(admin)/admin/customers/[id]/_components/CustomerProfile";
import CustomerAddresses from "@/app/(admin)/admin/customers/[id]/_components/CustomerAddresses";
import CustomerOrders from "@/app/(admin)/admin/customers/[id]/_components/CustomerOrders";

export const metadata: Metadata = {
  title: "Customer Profile | Admin Portal",
};

export default async function AdminCustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-8 rounded-none">
      
      {/* Customer Header */}
      <CustomerHeader customer={customer} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <CustomerProfile customer={customer} />
          <CustomerAddresses addresses={customer.addresses} />
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerOrders orders={customer.orders} />
        </div>
      </div>
    </div>
  );
}
