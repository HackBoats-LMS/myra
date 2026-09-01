import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/app/(storefront)/account/_components/ProfileForm";
import AddressManager from "@/app/(storefront)/account/_components/AddressManager";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";

type AccountOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: { include: { product: true } };
  };
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
    console.warn("Database unreachable in AccountPage:", error instanceof Error ? error.message : "unknown error");
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
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">My Account</h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">Welcome back, {user.name || user.phoneNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Col: Profile Form & Change Password & Addresses */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ProfileForm user={user} />
            <AddressManager addresses={user.addresses} />
          </div>

          {/* Right Col: Recent Orders summary */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Order History</h3>
              {user.orders.length > 0 && (
                <Link href="/account/orders" className="text-xs font-bold text-[#B6925B] hover:text-[#9c7d4e] uppercase tracking-widest transition-colors flex items-center gap-1">
                  View All Orders <i className="ri-arrow-right-s-line" />
                </Link>
              )}
            </div>

            {user.orders.length === 0 ? (
              <div className="bg-white border border-[#B6925B]/20 shadow-sm p-12 text-center">
                <p className="text-gray-500">You haven&rsquo;t placed any orders yet.</p>
                <Link href="/collections" className="inline-block mt-6 bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors rounded-none">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden">
                <ul className="divide-y divide-[#B6925B]/10">
                  {user.orders.slice(0, 3).map((order: AccountOrderWithItems) => (
                    <li key={order.id}>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 px-6 py-5 hover:bg-[#FAFAFA] transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative w-14 h-[72px] bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0">
                            {order.orderItems[0]?.product.images[0] && (
                              <Image src={order.orderItems[0].product.images[0]} alt={order.orderItems[0].product.name} fill quality={100} className="object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm font-medium text-[#4A3B2C] truncate">
                              {order.orderItems[0]?.product.name || `Order #${order.id.split('-')[0]}`}
                              {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-widest mt-2
                              ${order.status === 'DELIVERED' ? 'bg-[#FAFAFA] text-green-700 border border-[#B6925B]/20' :
                                order.status === 'SHIPPED' ? 'bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30' :
                                order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30'}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm font-bold text-[#4A3B2C]">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          <i className="ri-arrow-right-s-line text-lg text-[#B6925B]" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
