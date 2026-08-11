import { prisma } from "@/lib/prisma";
import { ShoppingCartIcon, ArchiveBoxIcon, UsersIcon, ArrowTrendingUpIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default async function AdminDashboard() {
  const [
    totalOrders,
    revenueData,
    totalProducts,
    totalCustomers,
    lowStockCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { stockQuantity: { lt: 5 } } }),
  ]);

  const totalRevenue = revenueData._sum.totalAmount ?? 0;

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      icon: ShoppingCartIcon,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: ArrowTrendingUpIcon,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Products",
      value: totalProducts.toLocaleString("en-IN"),
      icon: ArchiveBoxIcon,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Customers",
      value: totalCustomers.toLocaleString("en-IN"),
      icon: UsersIcon,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Low Stock",
      value: lowStockCount.toLocaleString("en-IN"),
      icon: ExclamationTriangleIcon,
      color: lowStockCount > 0 ? "text-red-600" : "text-gray-400",
      bg: lowStockCount > 0 ? "bg-red-50" : "bg-gray-50",
    },
  ];

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Live overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 shadow-sm">
            <div className={`${bg} ${color} p-3 rounded-lg flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
