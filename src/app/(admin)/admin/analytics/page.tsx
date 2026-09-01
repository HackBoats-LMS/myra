import Link from "next/link";
import { getAnalyticsData } from "@/lib/analytics";
import { TrendingUp, CreditCard, RotateCcw, ShoppingCart, LineChart, type LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: 0 },
] as const;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const active = RANGES.find((r) => r.key === range)?.key ?? "30d";
  const days = RANGES.find((r) => r.key === active)?.days ?? 30;

  let analytics: Awaited<ReturnType<typeof getAnalyticsData>> | null = null;
  try {
    analytics = await getAnalyticsData(days);
  } catch (error) {
    console.warn("Database unreachable in AdminAnalyticsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const {
    netRevenue = 0,
    grossRevenue = 0,
    totalRefunds = 0,
    ordersCount = 0,
    daily = [],
    statusBreakdown = [],
    paymentBreakdown = [],
    topProducts = [],
    lowStock = [],
  } = analytics ?? {};

  const aov = ordersCount > 0 ? netRevenue / ordersCount : 0;
  const maxDaily = Math.max(...daily.map((d) => d.revenue), 0);

  const currency = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const summaryCards: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Net Revenue", value: currency(netRevenue), icon: TrendingUp },
    { label: "Gross Revenue", value: currency(grossRevenue), icon: CreditCard },
    { label: "Refunds", value: currency(totalRefunds), icon: RotateCcw },
    { label: "Orders", value: ordersCount.toLocaleString("en-IN"), icon: ShoppingCart },
    { label: "Avg Order Value", value: currency(aov), icon: LineChart },
  ];

  return (
    <main>
      <div className="mb-8 border-b border-[#B6925B]/20 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Analytics</h1>
          <p className="text-xs text-[#B6925B] mt-2 font-bold uppercase tracking-widest">Revenue, orders & performance</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border rounded-none transition-colors ${
                active === r.key
                  ? "bg-[#B6925B] text-white border-[#B6925B]"
                  : "bg-white text-[#4A3B2C] border-[#B6925B]/30 hover:bg-[#FAFAFA]"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
        {summaryCards.map(({ label, value, icon: IconComponent }) => (
          <div key={label} className="bg-white border border-[#B6925B]/20 p-6 shadow-sm rounded-none">
            <div className="w-11 h-11 bg-[#B6925B]/10 text-[#B6925B] flex items-center justify-center mb-3">
              <IconComponent className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-bold text-[#4A3B2C] mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white border border-[#B6925B]/20 p-6 shadow-sm">
          <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3 mb-5">Daily Revenue</h3>
          {daily.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales in this period.</p>
          ) : (
            <div className="flex items-end gap-[2px] h-40">
              {daily.slice(-30).map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div
                    title={`${d.day}: ${currency(d.revenue)} (${d.orders} orders)`}
                    className="w-full max-w-[28px] bg-[#B6925B] hover:bg-[#4A3B2C] transition-colors rounded-none"
                    style={{ height: maxDaily > 0 ? `${Math.max((d.revenue / maxDaily) * 100, 2)}%` : "2%" }}
                  />
                  <span className="mt-1 text-[8px] text-gray-400 rotate-0">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm">
          <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3 mb-5">Order Status</h3>
          <div className="space-y-2">
            {statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-xs">
                <span className="text-[#4A3B2C] font-semibold capitalize">{s.status.replace(/_/g, " ")}</span>
                <span className="text-gray-600">{s.count} · {currency(s.revenue)}</span>
              </div>
            ))}
          </div>
          <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 py-3 mt-6 mb-3">Payment Methods</h3>
          <div className="space-y-2">
            {paymentBreakdown.map((p) => (
              <div key={p.paymentMethod} className="flex items-center justify-between text-xs">
                <span className="text-[#4A3B2C] font-semibold">{p.paymentMethod.replace(/_/g, " ")}</span>
                <span className="text-gray-600">{p.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-[#B6925B]/20 p-6 shadow-sm">
          <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3 mb-4">Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center gap-4 p-2 hover:bg-[#FAFAFA] transition-colors rounded-none">
                  <span className="w-6 text-center font-serif font-bold text-[#B6925B]">{i + 1}</span>
                  <span className="text-[10px] text-[#B6925B]">{currency(p.revenue)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#4A3B2C] truncate">{p.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{p.totalSold} sold</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm">
          <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-3 mb-4">Low Stock Alerts</h3>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm">All products are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center justify-between gap-3 p-2 hover:bg-red-50 transition-colors rounded-none">
                  <span className="text-sm font-bold text-[#4A3B2C] truncate">{p.name}</span>
                  <span className={`text-xs font-bold whitespace-nowrap ${p.stockQuantity === 0 ? "text-red-700" : "text-orange-600"}`}>
                    {p.stockQuantity === 0 ? "Out of stock" : `${p.stockQuantity} left`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
