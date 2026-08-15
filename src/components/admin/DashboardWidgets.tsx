"use client";
import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma";

interface RecentOrder {
  id: string;
  createdAt: Date;
  totalAmount: number;
  status: OrderStatus;
  user?: { name?: string | null; email?: string | null } | null;
}

interface SevenDayOrder {
  createdAt: Date;
  totalAmount: number;
}

interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQuantity: number;
}

export default function DashboardWidgets({
  recentOrders,
  lowStockProducts,
  sevenDayOrders,
  topProducts,
}: {
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  sevenDayOrders: SevenDayOrder[];
  topProducts: TopProduct[];
}) {
  // Generate last 7 days array
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Group orders by day
  const revenueByDay = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const total = sevenDayOrders
      .filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= day && orderDate < nextDay;
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      date: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      total,
    };
  });

  const maxRevenue = Math.max(...revenueByDay.map((d) => d.total), 1); // Avoid division by zero

  const statusColors: Record<OrderStatus, string> = {
    PENDING: "bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30",
    READY_TO_SHIP: "bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30",
    SHIPPED: "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30",
    OUT_FOR_DELIVERY: "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30",
    DELIVERED: "bg-[#FAFAFA] text-green-700 border border-[#B6925B]/20",
    CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Column 1: Revenue Chart & Top Products */}
      <div className="space-y-8">
        {/* Revenue Chart */}
        <div className="bg-white border border-[#B6925B]/20 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#4A3B2C] mb-6 uppercase tracking-widest">Revenue (Last 7 Days)</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {revenueByDay.map((day, i) => {
              const heightPercent = (day.total / maxRevenue) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#4A3B2C] text-white text-xs py-1 px-2 font-bold tracking-widest transition-opacity">
                    Rs. {day.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                  <div
                    className="w-full bg-[#B6925B] transition-all duration-300 hover:bg-[#9c7d4e]"
                    style={{ height: `${heightPercent || 2}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-500 mt-2 font-bold tracking-widest uppercase truncate">
                    {day.date.split(",")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-[#B6925B]/20 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#4A3B2C] mb-4 uppercase tracking-widest">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No sales data yet.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 p-3 hover:bg-[#FAFAFA] border border-transparent hover:border-[#B6925B]/20 transition-all">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#FAFAFA] border border-[#B6925B]/20 text-[#B6925B] font-bold text-xs">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#4A3B2C] truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{p.totalSold} sold</p>
                  </div>
                  <Link href={`/admin/products/${p.id}`} className="text-[10px] font-bold text-[#B6925B] uppercase tracking-widest hover:underline">
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Column 2: Recent Orders & Low Stock */}
      <div className="space-y-8">
        {/* Recent Orders */}
        <div className="bg-white border border-[#B6925B]/20 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-[#4A3B2C] uppercase tracking-widest">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[10px] font-bold text-[#B6925B] uppercase tracking-widest hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No recent orders.</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-[#B6925B]/20 hover:bg-[#FAFAFA] transition-colors">
                  <div>
                    <p className="text-sm font-bold text-[#4A3B2C]">
                      {order.user?.name || order.user?.email || "Guest User"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • Rs. {order.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-widest ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <Link href={`/admin/orders/${order.id}`} className="text-sm text-[#B6925B] hover:text-[#4A3B2C] transition-colors">
                      &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-red-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-red-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              Low Stock Alerts
            </h2>
          </div>
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500">All products have healthy stock levels.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-red-900 truncate">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-widest">
                      {p.stockQuantity} left
                    </span>
                    <Link href={`/admin/products/${p.id}`} className="text-[10px] font-bold text-red-700 uppercase tracking-widest hover:underline whitespace-nowrap">
                      Restock
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
