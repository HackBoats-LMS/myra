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

type SafeUser = Omit<Prisma.UserGetPayload<{
  include: {
    addresses: { orderBy: { createdAt: 'asc' } };
    orders: {
      orderBy: { createdAt: 'desc' };
      include: { orderItems: { include: { product: true } } };
    };
  };
}>, 'password'> & { hasPassword: boolean };

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  let user: SafeUser | null = null;

  try {
    const rawUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        phoneNumber2: true,
        name: true,
        role: true,
        isDisabled: true,
        emailVerified: true,
        addressLine1: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        addresses: {
          orderBy: { createdAt: 'asc' }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
            couponCode: true,
            discountAmount: true,
            shippingAmount: true,
            orderItems: {
              include: { product: { select: { id: true, name: true, images: true, slug: true } } }
            }
          }
        }
      }
    });
    if (rawUser) {
      const { password: _, ...safeFields } = rawUser;
      user = { ...safeFields, hasPassword: _ !== null } as SafeUser;
    }
  } catch (error) {
    console.warn("Database unreachable in AccountPage:", error instanceof Error ? error.message : "unknown error");
    return (
      <div className="w-full bg-[#F5EFE6] min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 border border-[#7A0B2E]/20 text-center">
          <h1 className="text-2xl font-serif text-[#2D1F2F] mb-4">Database Connection Error</h1>
          <p className="text-gray-500 mb-6">We could not load your account details because the database is currently unreachable. Please try again later or check your database status.</p>
        </div>
      </div>
    );
  }

  if (!user) redirect("/login");

  return (
    <div className="w-full bg-[#F5EFE6] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="mb-10 pb-8 border-b border-[#7A0B2E]/20 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-[#2D1F2F] tracking-wide">My Account</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-3 uppercase tracking-widest">Welcome back, {user.name || user.phoneNumber}</p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Col: Profile Form & Addresses */}
          <aside className="w-full lg:w-1/3 flex flex-col gap-8">
            <ProfileForm user={user} />
            <AddressManager addresses={user.addresses} />
          </aside>

          {/* Right Col: Recent Orders summary */}
          <main className="w-full lg:w-2/3 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-[#2D1F2F] tracking-wide">Order History</h2>
              {user.orders.length > 0 && (
                <Link href="/account/orders" className="text-xs font-bold text-[#7A0B2E] hover:text-[#2D1F2F] uppercase tracking-widest transition-colors flex items-center gap-1">
                  View All Orders <i className="ri-arrow-right-s-line" />
                </Link>
              )}
            </div>

            {user.orders.length === 0 ? (
              <div className="bg-white border border-[#7A0B2E]/20 p-12 md:p-20 text-center flex flex-col items-center justify-center flex-grow min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-[#F5EFE6] border border-[#7A0B2E]/20 flex items-center justify-center mb-6">
                  <i className="ri-shopping-bag-3-line text-3xl text-[#7A0B2E]" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-[#2D1F2F] mb-3">No Orders Yet</h3>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">
                  You haven&rsquo;t placed any orders yet. Discover our latest collections and find something you love.
                </p>
                <Link href="/collections" className="inline-block bg-[#7A0B2E] hover:bg-[#2D1F2F] text-white px-10 py-4 text-sm font-bold uppercase tracking-widest transition-colors rounded-none">
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-[#7A0B2E]/20 overflow-hidden">
                <ul className="divide-y divide-[#7A0B2E]/10">
                  {user.orders.slice(0, 3).map((order: AccountOrderWithItems) => (
                    <li key={order.id}>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="flex items-center justify-between gap-4 px-6 py-5 hover:bg-[#F5EFE6] transition-colors"
                      >
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="relative w-16 h-20 bg-[#F5EFE6] border border-[#7A0B2E]/20 overflow-hidden flex-shrink-0">
                            {order.orderItems[0]?.product.images[0] && (
                              <Image src={order.orderItems[0].product.images[0]} alt={order.orderItems[0].product.name} fill quality={100} className="object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-base font-serif text-[#2D1F2F] truncate">
                              {order.orderItems[0]?.product.name || `Order #${order.id.split('-')[0]}`}
                              {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-[9px] font-bold uppercase tracking-widest mt-2
                              ${order.status === 'DELIVERED' ? 'bg-[#F5EFE6] text-green-700 border border-[#7A0B2E]/20' :
                                order.status === 'SHIPPED' ? 'bg-[#F5EFE6] text-[#7A0B2E] border border-[#7A0B2E]/30' :
                                order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-[#F5EFE6] text-[#2D1F2F] border border-[#7A0B2E]/30'}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-base font-bold text-[#2D1F2F]">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          <i className="ri-arrow-right-s-line text-xl text-[#7A0B2E]" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
