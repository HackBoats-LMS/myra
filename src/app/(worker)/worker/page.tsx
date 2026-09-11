import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  FolderOpen,
  Truck,
  Clock,
  MapPin,
  Wrench,
  Plus,
  ArrowRight,
  CheckCircle,
  Eye,
  type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  color: string;
  badge?: string;
}

export default async function WorkerDashboardPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || "Team Member";
  const isAdmin = session?.user?.role === "ADMIN";
  const canInventory = isAdmin || session?.user?.canManageInventory;
  const canShipping = isAdmin || session?.user?.canManageShipping;

  let productCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let collectionCount = 0;
  let pendingOrders = 0;
  let shippedOrders = 0;
  let outForDelivery = 0;
  let urgentOrders: any[] = [];
  let urgentStockItems: any[] = [];

  try {
    const counts = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, stockQuantity: { lte: 5, gt: 0 } } }),
      prisma.product.count({ where: { deletedAt: null, stockQuantity: { lte: 0 } } }),
      prisma.collection.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "READY_TO_SHIP"] } } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
      canShipping
        ? prisma.order.findMany({
            where: { status: { in: ["PENDING", "READY_TO_SHIP"] } },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { name: true, email: true, phoneNumber: true } },
              _count: { select: { orderItems: true } },
            },
          })
        : Promise.resolve([]),
      canInventory
        ? prisma.product.findMany({
            where: { deletedAt: null, stockQuantity: { lte: 5 } },
            take: 5,
            orderBy: { stockQuantity: "asc" },
            select: { id: true, name: true, code: true, stockQuantity: true, price: true },
          })
        : Promise.resolve([]),
    ]);

    productCount = counts[0];
    lowStockCount = counts[1];
    outOfStockCount = counts[2];
    collectionCount = counts[3];
    pendingOrders = counts[4];
    shippedOrders = counts[5];
    outForDelivery = counts[6];
    urgentOrders = counts[7];
    urgentStockItems = counts[8];
  } catch (error) {
    console.warn("Database unreachable in WorkerDashboardPage:", error instanceof Error ? error.message : "unknown error");
  }

  const inventoryStats: StatItem[] = [
    {
      label: "Total Products",
      value: productCount,
      icon: Package,
      href: "/worker/products",
      color: "text-[#7A0B2E]",
    },
    {
      label: "Low Stock Items",
      value: lowStockCount,
      icon: AlertTriangle,
      href: "/worker/products",
      color: lowStockCount > 0 ? "text-amber-600" : "text-[#7A0B2E]",
      badge: lowStockCount > 0 ? "Needs Restock" : undefined,
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      icon: AlertTriangle,
      href: "/worker/products",
      color: outOfStockCount > 0 ? "text-red-600" : "text-[#7A0B2E]",
      badge: outOfStockCount > 0 ? "Urgent" : undefined,
    },
    {
      label: "Collections",
      value: collectionCount,
      icon: FolderOpen,
      href: "/worker/collections",
      color: "text-[#7A0B2E]",
    },
  ];

  const shippingStats: StatItem[] = [
    {
      label: "Awaiting Shipping",
      value: pendingOrders,
      icon: Truck,
      href: "/worker/orders?status=PENDING",
      color: pendingOrders > 0 ? "text-red-700" : "text-[#7A0B2E]",
      badge: pendingOrders > 0 ? "Action Required" : undefined,
    },
    {
      label: "In Transit",
      value: shippedOrders,
      icon: Clock,
      href: "/worker/orders?status=SHIPPED",
      color: "text-[#7A0B2E]",
    },
    {
      label: "Out for Delivery",
      value: outForDelivery,
      icon: MapPin,
      href: "/worker/orders?status=OUT_FOR_DELIVERY",
      color: "text-emerald-700",
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
      {/* Top Banner & Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#7A0B2E]/15 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#7A0B2E]">
              Operational Shift Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide mt-1">
            Welcome back, {name}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">{currentDateStr}</p>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2">
          {canInventory && (
            <Link
              href="/worker/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0B2E] hover:bg-[#5C0820] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          )}
          {canShipping && (
            <Link
              href="/worker/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#7A0B2E]/30 hover:border-[#7A0B2E] text-[#2D1F2F] text-xs font-bold uppercase tracking-widest transition-colors shadow-2xs"
            >
              <Truck className="w-4 h-4 text-[#7A0B2E]" />
              <span>Orders Queue</span>
            </Link>
          )}
        </div>
      </div>

      {/* No module assigned state */}
      {!canInventory && !canShipping && (
        <div className="bg-white border border-[#7A0B2E]/20 p-10 text-center shadow-xs">
          <div className="w-12 h-12 bg-[#F8F4EE] border border-[#7A0B2E]/20 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6 text-[#7A0B2E]" />
          </div>
          <h3 className="font-serif text-lg text-[#2D1F2F] mb-2 font-bold">No Modules Assigned Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Your worker profile does not have Inventory or Shipping permissions enabled. Ask a store administrator
            to grant your permissions from the Staff & Workers section.
          </p>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      {(canInventory || canShipping) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A0B2E]">
              Live Shift Metrics
            </h2>
            <span className="text-[11px] text-gray-400">Auto-updated</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(canShipping ? shippingStats : []).concat(canInventory ? inventoryStats.slice(0, canShipping ? 1 : 4) : []).map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="bg-white p-5 border border-[#7A0B2E]/15 shadow-2xs hover:border-[#7A0B2E]/40 hover:shadow-xs transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">
                      {stat.label}
                    </span>
                    <div className="w-8 h-8 bg-[#FDFBF7] border border-[#7A0B2E]/15 flex items-center justify-center text-[#7A0B2E] group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl sm:text-3xl font-serif font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                    {stat.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                        {stat.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Operational Queues (Shipping & Inventory Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Queue */}
        {canShipping && (
          <div className="bg-white border border-[#7A0B2E]/15 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#7A0B2E]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D1F2F]">
                    Orders Awaiting Fulfilment
                  </h3>
                </div>
                <Link
                  href="/worker/orders"
                  className="text-[10px] uppercase font-bold text-[#7A0B2E] hover:underline tracking-wider"
                >
                  View All ({pendingOrders}) &rarr;
                </Link>
              </div>

              {urgentOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <CheckCircle className="w-8 h-8 text-emerald-600/70 mx-auto mb-2" />
                  All orders are fulfilled and packed!
                </div>
              ) : (
                <div className="divide-y divide-gray-100 mt-2">
                  {urgentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="py-3 flex items-center justify-between hover:bg-[#FDFBF7] px-2 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold text-[#2D1F2F] truncate">
                          Order #{ord.id.split("-")[0]}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {ord.user?.name || ord.user?.email || "Guest"} • {ord._count.orderItems} item(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200">
                          {ord.status}
                        </span>
                        <Link
                          href={`/worker/orders/${ord.id}`}
                          className="p-1.5 text-[#7A0B2E] hover:text-[#5C0820] hover:bg-gray-100 transition-colors"
                          title="View order details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link
                href="/worker/orders"
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest bg-[#F8F6F2] hover:bg-[#EFE9DF] text-[#2D1F2F] border border-[#7A0B2E]/20 transition-colors"
              >
                <span>Open Shipping Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A0B2E]" />
              </Link>
            </div>
          </div>
        )}

        {/* Inventory Stock Alerts */}
        {canInventory && (
          <div className="bg-white border border-[#7A0B2E]/15 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#2D1F2F]">
                    Low Stock & Critical Inventory
                  </h3>
                </div>
                <Link
                  href="/worker/products"
                  className="text-[10px] uppercase font-bold text-[#7A0B2E] hover:underline tracking-wider"
                >
                  Inventory &rarr;
                </Link>
              </div>

              {urgentStockItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <CheckCircle className="w-8 h-8 text-emerald-600/70 mx-auto mb-2" />
                  No critically low items. Stock levels look healthy!
                </div>
              ) : (
                <div className="divide-y divide-gray-100 mt-2">
                  {urgentStockItems.map((prod) => (
                    <div
                      key={prod.id}
                      className="py-3 flex items-center justify-between hover:bg-[#FDFBF7] px-2 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold text-[#2D1F2F] truncate">{prod.name}</p>
                        <p className="text-[10px] font-mono text-gray-400">
                          {prod.code ? `SKU: ${prod.code}` : "Uncoded product"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${
                            prod.stockQuantity <= 0
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {prod.stockQuantity} left
                        </span>
                        <Link
                          href={`/worker/products/${prod.id}`}
                          className="p-1.5 text-[#7A0B2E] hover:text-[#5C0820] hover:bg-gray-100 transition-colors"
                          title="Edit product stock"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link
                href="/worker/products"
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest bg-[#F8F6F2] hover:bg-[#EFE9DF] text-[#2D1F2F] border border-[#7A0B2E]/20 transition-colors"
              >
                <span>Manage All Inventory</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A0B2E]" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {canInventory && (
          <Link
            href="/worker/products/new"
            className="bg-white border border-[#7A0B2E]/15 p-5 shadow-2xs hover:border-[#7A0B2E]/40 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#FDFBF7] border border-[#7A0B2E]/20 flex items-center justify-center text-[#7A0B2E] group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#2D1F2F]">Create New Product</h3>
            </div>
            <p className="text-xs text-gray-500">Upload media, set specifications, and assign stock.</p>
          </Link>
        )}

        {canInventory && (
          <Link
            href="/worker/collections"
            className="bg-white border border-[#7A0B2E]/15 p-5 shadow-2xs hover:border-[#7A0B2E]/40 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#FDFBF7] border border-[#7A0B2E]/20 flex items-center justify-center text-[#7A0B2E] group-hover:scale-105 transition-transform">
                <FolderOpen className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#2D1F2F]">Categories & Hierarchy</h3>
            </div>
            <p className="text-xs text-gray-500">Organize menu order, category banners, and collections.</p>
          </Link>
        )}

        {canShipping && (
          <Link
            href="/worker/orders"
            className="bg-white border border-[#7A0B2E]/15 p-5 shadow-2xs hover:border-[#7A0B2E]/40 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#FDFBF7] border border-[#7A0B2E]/20 flex items-center justify-center text-[#7A0B2E] group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#2D1F2F]">Shiprocket Courier</h3>
            </div>
            <p className="text-xs text-gray-500">Generate AWB tracking labels and mark packages ready.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
