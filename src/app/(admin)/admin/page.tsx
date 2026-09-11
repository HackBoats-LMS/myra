import { prisma } from "@/lib/db/prisma";
import DashboardWidgets from "@/app/(admin)/admin/_components/DashboardWidgets";
import { Prisma } from "@/generated/prisma";
import Link from "next/link";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  Plus,
  LineChart,
  type LucideIcon,
} from "lucide-react";

type OrderAggregate = {
  _sum: { totalAmount: number | null; refundedAmount: number | null } | null;
};
type RecentOrder = Prisma.OrderGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;
type LowStockProduct = Prisma.ProductGetPayload<{
  select: { id: true; name: true; stockQuantity: true; slug: true; images: true };
}>;
type TopSoldItem = { productId: string; _sum: { quantity: number | null } | null };

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let totalOrders = 0;
  let revenueData: OrderAggregate = {} as OrderAggregate;
  let totalProducts = 0;
  let totalCustomers = 0;
  let lowStockCount = 0;
  let recentOrders: RecentOrder[] = [];
  let lowStockProducts: LowStockProduct[] = [];
  let sevenDayOrders: { totalAmount: number; createdAt: Date }[] = [];
  let topItems: TopSoldItem[] = [];
  let topProducts: { id: string; name: string; totalSold: number }[] = [];

  try {
    const results = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { totalAmount: true, refundedAmount: true },
      }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { deletedAt: null, stockQuantity: { lt: 5 } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.product.findMany({
        where: { deletedAt: null, stockQuantity: { lt: 5 } },
        take: 5,
        orderBy: { stockQuantity: "asc" },
        select: { id: true, name: true, stockQuantity: true, slug: true, images: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { not: "CANCELLED" },
        },
        select: { totalAmount: true, createdAt: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    totalOrders = results[0];
    revenueData = results[1];
    totalProducts = results[2];
    totalCustomers = results[3];
    lowStockCount = results[4];
    recentOrders = results[5];
    lowStockProducts = results[6];
    sevenDayOrders = results[7];
    topItems = results[8];

    const topProductIds = topItems.map((item) => item.productId);
    const topProductsRaw = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, slug: true, images: true },
    });

    topProducts = topItems
      .map((item) => {
        const p = topProductsRaw.find((prod) => prod.id === item.productId);
        return {
          id: p?.id ?? "",
          name: p?.name ?? "",
          totalSold: item._sum?.quantity || 0,
        };
      })
      .filter((p) => p.id);
  } catch (error) {
    console.warn("Database unreachable in AdminDashboard:", error instanceof Error ? error.message : "unknown error");
  }

  const grossRevenue = revenueData._sum?.totalAmount ?? 0;
  const totalRefunded = revenueData._sum?.refundedAmount ?? 0;
  const totalRevenue = grossRevenue - totalRefunded;

  const stats: {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    href: string;
    badge?: string;
  }[] = [
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      icon: ShoppingCart,
      color: "text-[#7A0B2E]",
      href: "/admin/orders",
    },
    {
      label: "Net Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: "text-emerald-700",
      href: "/admin/analytics",
    },
    {
      label: "Active Products",
      value: totalProducts.toLocaleString("en-IN"),
      icon: Package,
      color: "text-[#7A0B2E]",
      href: "/admin/products",
    },
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString("en-IN"),
      icon: Users,
      color: "text-[#7A0B2E]",
      href: "/admin/customers",
    },
    {
      label: "Low Stock Alert",
      value: lowStockCount.toLocaleString("en-IN"),
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-amber-700" : "text-[#7A0B2E]",
      href: "/admin/products",
      badge: lowStockCount > 0 ? "Attention" : undefined,
    },
  ];

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Top Banner with date & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#7A0B2E]/15 pb-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#7A0B2E]">
            Store Performance & Overview
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">{currentDateStr}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#7A0B2E]/30 hover:border-[#7A0B2E] text-[#2D1F2F] text-xs font-bold uppercase tracking-widest transition-colors shadow-2xs"
          >
            <LineChart className="w-4 h-4 text-[#7A0B2E]" />
            <span>Analytics</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0B2E] hover:bg-[#5C0820] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: IconComponent, color, href, badge }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-[#7A0B2E]/15 p-5 shadow-2xs hover:border-[#7A0B2E]/40 hover:shadow-xs transition-all group relative"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                {label}
              </span>
              <div className="w-8 h-8 bg-[#FDFBF7] border border-[#7A0B2E]/15 flex items-center justify-center text-[#7A0B2E] group-hover:scale-105 transition-transform">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className={`text-xl sm:text-2xl font-serif font-bold ${color}`}>
                {value}
              </span>
              {badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                  {badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Detailed Activity & Analytics Widgets */}
      <DashboardWidgets
        recentOrders={recentOrders}
        lowStockProducts={lowStockProducts}
        sevenDayOrders={sevenDayOrders}
        topProducts={topProducts}
      />
    </div>
  );
}
