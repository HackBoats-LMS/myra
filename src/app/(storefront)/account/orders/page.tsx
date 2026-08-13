import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: { include: { product: true } };
  };
}>;

type OrderItemWithProduct = Prisma.OrderItemGetPayload<{
  include: { product: true };
}>;

export const metadata: Metadata = {
  title: "My Orders | Myra Shopping Mall",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
  });

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors gap-1 mb-6">
            <i className="ri-arrow-left-line text-sm" />
            Back to Account
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">My Orders</h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-[#B6925B]/20 shadow-sm p-12 text-center">
            <i className="ri-shopping-bag-line text-4xl text-gray-300 mb-4 block" />
            <p className="text-gray-500 mb-6">You haven&apos;t placed any orders yet.</p>
            <Link href="/collections" className="inline-block bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors rounded-none">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: OrderWithItems) => (
              <div key={order.id} className="bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden">
                <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-[#B6925B]/20">
                  <div>
                    <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold">Order Placed</p>
                    <p className="text-sm text-[#4A3B2C] font-medium mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold">Total</p>
                    <p className="text-sm text-[#4A3B2C] font-medium mt-1">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-widest mt-1.5
                      ${order.status === "DELIVERED" ? "bg-[#FAFAFA] text-green-700 border border-[#B6925B]/20" :
                        order.status === "SHIPPED" ? "bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30" :
                        order.status === "CANCELLED" ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30"}`}>
                      {order.status}
                    </span>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-end text-xs font-bold text-[#B6925B] hover:text-[#9c7d4e] uppercase tracking-widest transition-colors"
                  >
                    View Details <i className="ri-arrow-right-s-line" />
                  </Link>
                </div>

                <div className="p-6 divide-y divide-[#B6925B]/10">
                  {order.orderItems.slice(0, 3).map((item: OrderItemWithProduct) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                      <div className="relative w-16 h-20 bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0">
                        {item.product.images[0] && (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#4A3B2C] truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-[#4A3B2C] flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <p className="text-xs text-gray-400 pt-3">+{order.orderItems.length - 3} more item{order.orderItems.length - 3 !== 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
