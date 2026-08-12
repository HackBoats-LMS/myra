import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/storefront/ProfileForm";
import ChangePasswordForm from "@/components/storefront/ChangePasswordForm";
import AddressManager from "@/components/storefront/AddressManager";
import DeleteAccountCard from "@/components/storefront/DeleteAccountCard";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";

type AccountOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: { include: { product: true } };
  };
}>;

type OrderItemWithProduct = Prisma.OrderItemGetPayload<{
  include: { product: true };
}>;

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  let user: Prisma.UserGetPayload<{
    include: {
      addresses: { orderBy: { createdAt: 'asc' } };
      orders: {
        orderBy: { createdAt: 'desc' };
        include: { orderItems: { include: { product: true } } };
      };
    };
  }> | null = null;

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          orderBy: { createdAt: 'asc' }
        },
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
  } catch (error) {
    console.warn("Database unreachable in AccountPage:", error);
    return (
      <div className="w-full bg-[#FAFAFA] min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 border border-[#B6925B]/20 text-center">
          <h1 className="text-2xl font-serif text-[#4A3B2C] mb-4">Database Connection Error</h1>
          <p className="text-gray-500 mb-6">We could not load your account details because the database is currently unreachable. Please try again later or check your database status.</p>
        </div>
      </div>
    );
  }

  if (!user) redirect("/login");

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">My Account</h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">Welcome back, {user.name || user.phoneNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Col: Profile Form & Change Password & Addresses */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ProfileForm user={user} />
            <AddressManager addresses={user.addresses} />
            <ChangePasswordForm />
            <DeleteAccountCard userEmail={user.email} userPhone={user.phoneNumber} />
          </div>

          {/* Right Col: Order History */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide mb-6">Order History</h3>
            
            {user.orders.length === 0 ? (
              <div className="bg-white border border-[#B6925B]/20 shadow-sm p-12 text-center">
                <p className="text-gray-500">You haven&rsquo;t placed any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {user.orders.map((order: AccountOrderWithItems) => (
                  <div key={order.id} className="bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden">
                    <div className="bg-white border-b border-[#B6925B]/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#B6925B] uppercase tracking-widest font-bold">Order Placed</p>
                        <p className="text-sm text-[#4A3B2C] font-medium mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#B6925B] uppercase tracking-widest font-bold">Total</p>
                        <p className="text-sm text-[#4A3B2C] font-medium mt-1">Rs. {order.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#B6925B] uppercase tracking-widest font-bold">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-widest mt-1.5
                          ${order.status === 'DELIVERED' ? 'bg-[#FAFAFA] text-green-700 border border-[#B6925B]/20' : 
                            order.status === 'SHIPPED' ? 'bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30' : 
                            order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' : 
                            'bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-xs text-[#B6925B] uppercase tracking-widest font-bold">Order ID</p>
                          <p className="text-sm text-[#4A3B2C] font-mono mt-1">{order.id.split('-')[0]}</p>
                        </div>
                        <Link href={`/account/orders/${order.id}`} className="text-xs font-bold text-[#B6925B] hover:text-[#9c7d4e] uppercase tracking-widest pl-4 border-l border-[#B6925B]/20 mt-1">
                          Details
                        </Link>
                      </div>
                    </div>
                    
                    <div className="p-6 divide-y divide-[#B6925B]/10">
                      {order.orderItems.map((item: OrderItemWithProduct) => (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                          <div className="relative w-16 h-20 bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0">
                            {item.product.images[0] && (
                              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#4A3B2C]">{item.product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-sm font-medium text-[#4A3B2C]">
                            Rs. {(item.price * item.quantity).toLocaleString('en-IN')}
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
    </div>
  );
}
