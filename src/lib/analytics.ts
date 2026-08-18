import { unstable_cache } from "next/cache";
import { subDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db/prisma";

export const ANALYTICS_TAG = "analytics";

const ORDER_STATUSES = ["PENDING", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;

export interface AnalyticsData {
  netRevenue: number;
  grossRevenue: number;
  totalRefunds: number;
  ordersCount: number;
  daily: { day: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; count: number; revenue: number }[];
  paymentBreakdown: { paymentMethod: string; count: number; revenue: number }[];
  topProducts: { id: string; name: string; image: string | null; totalSold: number; revenue: number }[];
  lowStock: { id: string; name: string; stockQuantity: number }[];
}

async function fetchAnalyticsData(days: number): Promise<AnalyticsData> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = days > 0 ? startDate : undefined;
  const where = start ? { createdAt: { gte: start } } : {};
  const validWhere = { ...where, status: { not: "CANCELLED" as const } };

  const [grossAgg, refundAgg, orderAgg, rawDaily, rawStatus, rawPayment, topItems, lowStockRes] =
    await Promise.all([
      prisma.order.aggregate({ where: validWhere, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where, _sum: { refundedAmount: true } }),
      prisma.order.count({ where: validWhere }),
      prisma.order.findMany({
        where: validWhere,
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { totalAmount: true } }),
      prisma.order.groupBy({ by: ["paymentMethod"], _count: { _all: true }, _sum: { totalAmount: true } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 8,
      }),
      prisma.product.findMany({
        where: { deletedAt: null, stockQuantity: { lte: 5 } },
        orderBy: { stockQuantity: "asc" },
        select: { id: true, name: true, stockQuantity: true },
        take: 10,
      }),
    ]);

  const grossRevenue = grossAgg._sum.totalAmount ?? 0;
  const totalRefunds = refundAgg._sum.refundedAmount ?? 0;

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (const o of rawDaily) {
    const key = o.createdAt.toLocaleDateString("en-CA");
    const b = buckets.get(key) ?? { revenue: 0, orders: 0 };
    b.revenue += o.totalAmount;
    b.orders += 1;
    buckets.set(key, b);
  }
  const daily = [...buckets.entries()].map(([day, v]) => ({ day, revenue: v.revenue, orders: v.orders }));

  const statusBreakdown = ORDER_STATUSES.map((status) => {
    const hit = rawStatus.find((s) => s.status === status);
    return { status, count: hit?._count._all ?? 0, revenue: hit?._sum.totalAmount ?? 0 };
  });

  const paymentBreakdown = rawPayment.map((p) => ({
    paymentMethod: p.paymentMethod ?? "UNKNOWN",
    count: p._count._all,
    revenue: p._sum.totalAmount ?? 0,
  }));

  const ids = topItems.map((t) => t.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, price: true, images: true },
  });
  const topProducts = topItems.map((t) => {
    const p = products.find((x) => x.id === t.productId);
    return {
      id: t.productId,
      name: p?.name ?? "Unknown",
      image: p?.images[0] ?? null,
      totalSold: t._sum.quantity ?? 0,
      revenue: (t._sum.quantity ?? 0) * (p?.price ?? 0),
    };
  });

  return {
    netRevenue: grossRevenue - totalRefunds,
    grossRevenue,
    totalRefunds,
    ordersCount: orderAgg,
    daily,
    statusBreakdown,
    paymentBreakdown,
    topProducts,
    lowStock: lowStockRes,
  };
}

export const getAnalyticsData = unstable_cache(fetchAnalyticsData, ["analytics", "data"], {
  tags: [ANALYTICS_TAG],
  revalidate: 300,
});
