import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import DisableUserButton from "@/components/admin/DisableUserButton";
import type { Metadata } from "next";

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
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-8">
      {/* Back button */}
      <div>
        <Link href="/admin/customers" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{customer.name || "Unnamed Customer"}</h1>
            <p className="text-sm text-gray-500 mt-1">Registered on {new Date(customer.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</p>
          </div>
          <div className="flex items-center gap-3">
            <DisableUserButton userId={customer.id} initialDisabled={customer.isDisabled} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Profile Details</h3>
            <div className="text-sm space-y-3">
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Email</span>
                <span className="text-gray-900 font-medium">{customer.email || "No email"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Phone</span>
                <span className="text-gray-900 font-medium">{customer.phoneNumber || "No phone number"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Role</span>
                <span className="text-gray-900 font-semibold uppercase tracking-wider text-xs">{customer.role}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mt-1
                  ${customer.isDisabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                  {customer.isDisabled ? "Banned" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Saved Addresses card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Saved Addresses ({customer.addresses.length})</h3>
            {customer.addresses.length === 0 ? (
              <p className="text-xs text-gray-500">No saved addresses.</p>
            ) : (
              <div className="space-y-4 divide-y divide-gray-100">
                {customer.addresses.map((addr) => (
                  <div key={addr.id} className="pt-3 first:pt-0 text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="bg-[#0D3B66]/10 text-[#0D3B66] px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">
                          Default
                        </span>
                      )}
                    </div>
                    <p>{addr.addressLine1}</p>
                    <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                    <p>{addr.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Order History ({customer.orders.length})</h3>
            {customer.orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No orders placed by this customer yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                      <th className="py-3">Order ID</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Total</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 font-mono text-xs text-gray-600">#{order.id.split("-")[0]}</td>
                        <td className="py-3.5 text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${order.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                              order.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                              order.status === "SHIPPED" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-bold text-[#0D3B66] hover:underline uppercase tracking-wider"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
