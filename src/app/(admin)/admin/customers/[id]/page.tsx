import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DisableUserButton from "@/components/admin/DisableUserButton";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import WorkerCapabilitiesSelect from "@/components/admin/WorkerCapabilitiesSelect";
import EditCustomerForm from "@/components/admin/EditCustomerForm";
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
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-8 rounded-none">
      {/* Back button */}
      <div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B6925B]/20 pb-6">
          <div>
            <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">{customer.name || "Unnamed Customer"}</h1>
            <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Registered on {new Date(customer.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</p>
          </div>
          <div className="flex items-center gap-3">
            <EditCustomerForm
              userId={customer.id}
              name={customer.name}
              email={customer.email}
              phoneNumber={customer.phoneNumber}
            />
            <DisableUserButton userId={customer.id} initialDisabled={customer.isDisabled} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile card */}
          <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Profile Details</h3>
            <div className="text-sm space-y-4">
              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Email</span>
                <span className="text-[#4A3B2C] font-semibold">{customer.email || "No email"}</span>
              </div>
              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Phone</span>
                <span className="text-[#4A3B2C] font-semibold font-mono">{customer.phoneNumber || "No phone number"}</span>
              </div>
              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1">Role</span>
                <UserRoleSelect userId={customer.id} currentRole={customer.role} />
              </div>
              {customer.role === "MULTI_WORKER" && (
                <div className="md:col-span-3">
                  <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1">Worker Capabilities</span>
                  <WorkerCapabilitiesSelect
                    userId={customer.id}
                    canInventory={customer.canManageInventory}
                    canShipping={customer.canManageShipping}
                  />
                </div>
              )}
              <div>
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1">Status</span>
                <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest
                  ${customer.isDisabled ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#FAFAFA] text-green-700 border border-[#B6925B]/20"}`}>
                  {customer.isDisabled ? "Banned" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Saved Addresses card */}
          <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Saved Addresses ({customer.addresses.length})</h3>
            {customer.addresses.length === 0 ? (
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">No saved addresses.</p>
            ) : (
              <div className="space-y-4 divide-y divide-[#B6925B]/10">
                {customer.addresses.map((addr) => (
                  <div key={addr.id} className="pt-4 first:pt-0 text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1.5 leading-relaxed">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#4A3B2C]">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="bg-[#4A3B2C] text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="normal-case text-gray-600 font-semibold">{addr.addressLine1}</p>
                    <p className="normal-case text-gray-600 font-semibold">{addr.city}, {addr.state} - {addr.postalCode}</p>
                    <p className="capitalize">{addr.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Order History ({customer.orders.length})</h3>
            {customer.orders.length === 0 ? (
              <div className="text-center py-12 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                No orders placed by this customer yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#B6925B]/20 text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">
                      <th className="py-3">Order ID</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Total</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B6925B]/10">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                        <td className="py-4 font-mono text-xs text-gray-600">#{order.id.split("-")[0]}</td>
                        <td className="py-4 text-xs font-semibold text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest
                            ${order.status === "DELIVERED" ? "bg-[#FAFAFA] text-green-700 border border-[#B6925B]/10" :
                              order.status === "PENDING" ? "bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/10" :
                              order.status === "SHIPPED" ? "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/10" :
                              "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/10"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-[#4A3B2C]">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-[10px] font-bold text-[#B6925B] hover:text-[#4A3B2C] uppercase tracking-widest transition-colors"
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
