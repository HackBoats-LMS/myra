import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/storefront/ProfileForm";
import Image from "next/image";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto px-8 py-12 md:py-20 min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 tracking-tight">My Account</h1>
        <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">Welcome back, {user.name || user.phoneNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Col: Profile Form */}
        <div className="lg:col-span-1">
          <ProfileForm user={user} />
        </div>

        {/* Right Col: Order History */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-6">Order History</h3>
          
          {user.orders.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-12 text-center">
              <p className="text-gray-500">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {user.orders.map((order) => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Order Placed</p>
                      <p className="text-sm text-gray-900 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total</p>
                      <p className="text-sm text-gray-900 font-medium">₹{order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                        ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Order ID</p>
                      <p className="text-sm text-gray-900 font-mono">{order.id.split('-')[0]}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 divide-y divide-gray-100">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                        <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product.images[0] && (
                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
