import { prisma } from "@/lib/prisma";
import DashboardWidgets from "@/components/admin/DashboardWidgets";
import { Prisma } from "@/generated/prisma";

type OrderAggregate = Awaited<ReturnType<typeof prisma.order.aggregate>>;
type RecentOrder = Prisma.OrderGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;
type LowStockProduct = Prisma.ProductGetPayload<{
  select: { id: true; name: true; stockQuantity: true; slug: true; images: true };
}>;
type TopSoldItem = { productId: string; _sum: { quantity: number | null } | null };

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
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { stockQuantity: { lt: 5 } } }),
      prisma.order.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.product.findMany({
        where: { stockQuantity: { lt: 5 } },
        take: 5,
        orderBy: { stockQuantity: 'asc' },
        select: { id: true, name: true, stockQuantity: true, slug: true, images: true }
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { not: "CANCELLED" }
        },
        select: { totalAmount: true, createdAt: true }
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
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
      select: { id: true, name: true, price: true, slug: true, images: true }
    });

    topProducts = topItems.map((item) => {
      const p = topProductsRaw.find((prod) => prod.id === item.productId);
      return {
        id: p?.id ?? "",
        name: p?.name ?? "",
        totalSold: item._sum?.quantity || 0
      };
    }).filter((p) => p.id);
  } catch (error) {
    console.warn("Database unreachable in AdminDashboard:", error);
    // Silent fail to empty state
  }

  const totalRevenue = revenueData._sum?.totalAmount ?? 0;

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      iconClass: "ri-shopping-cart-2-line",
      color: "text-[#B6925B]",
      bg: "bg-[#B6925B]/10",
    },
    {
      label: "Total Revenue",
      value: `Rs. ${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      iconClass: "ri-funds-line",
      color: "text-[#B6925B]",
      bg: "bg-[#B6925B]/10",
    },
    {
      label: "Total Products",
      value: totalProducts.toLocaleString("en-IN"),
      iconClass: "ri-archive-line",
      color: "text-[#B6925B]",
      bg: "bg-[#B6925B]/10",
    },
    {
      label: "Customers",
      value: totalCustomers.toLocaleString("en-IN"),
      iconClass: "ri-group-line",
      color: "text-[#B6925B]",
      bg: "bg-[#B6925B]/10",
    },
    {
      label: "Low Stock",
      value: lowStockCount.toLocaleString("en-IN"),
      iconClass: "ri-error-warning-line",
      color: lowStockCount > 0 ? "text-red-700" : "text-[#B6925B]",
      bg: lowStockCount > 0 ? "bg-red-50" : "bg-[#B6925B]/10",
    },
  ];

  return (
    <main>
      <div className="mb-8 border-b border-[#B6925B]/20 pb-4">
        <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Dashboard</h1>
        <p className="text-xs text-[#B6925B] mt-2 font-bold uppercase tracking-widest">Live overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        {stats.map(({ label, value, iconClass, color, bg }) => (
          <div key={label} className="bg-white border border-[#B6925B]/20 p-6 flex items-start gap-4 shadow-sm rounded-none">
            <div className={`${bg} ${color} w-11 h-11 flex-shrink-0 border border-[#B6925B]/20 flex items-center justify-center rounded-none`}>
              <i className={`${iconClass} text-xl`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{label}</p>
              <p className="text-xl font-bold text-[#4A3B2C] mt-1 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <DashboardWidgets 
        recentOrders={recentOrders} 
        lowStockProducts={lowStockProducts} 
        sevenDayOrders={sevenDayOrders} 
        topProducts={topProducts} 
      />
    </main>
  );
}
