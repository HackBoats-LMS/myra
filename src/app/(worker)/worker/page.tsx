import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import Link from "next/link";
import {
  Archive,
  AlertTriangle,
  FolderOpen,
  Truck,
  Clock,
  MapPin,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  color: string;
}

export default async function WorkerDashboardPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || "Worker";
  const isAdmin = session?.user?.role === "ADMIN";
  const canInventory = isAdmin || session?.user?.canManageInventory;
  const canShipping = isAdmin || session?.user?.canManageShipping;

  const counts = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, stockQuantity: { lte: 5 } } }),
    prisma.collection.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "READY_TO_SHIP"] } } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
  ]);

  const [productCount, lowStockCount, collectionCount, pendingOrders, shippedOrders, outForDelivery] = counts;

  const inventoryStats: StatItem[] = [
    { label: "Products", value: productCount, icon: Archive, href: "/worker/products", color: "text-[#B6925B]" },
    { label: "Low Stock", value: lowStockCount, icon: AlertTriangle, href: "/worker/products", color: "text-red-600" },
    { label: "Collections", value: collectionCount, icon: FolderOpen, href: "/worker/collections", color: "text-[#B6925B]" },
  ];

  const shippingStats: StatItem[] = [
    { label: "To Ship", value: pendingOrders, icon: Truck, href: "/worker/orders", color: "text-[#B6925B]" },
    { label: "In Transit", value: shippedOrders, icon: Clock, href: "/worker/orders", color: "text-[#B6925B]" },
    { label: "Out for Delivery", value: outForDelivery, icon: MapPin, href: "/worker/orders", color: "text-[#B6925B]" },
  ];

  const stats = [
    ...(canInventory ? inventoryStats : []),
    ...(canShipping ? shippingStats : []),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Welcome back, {name}</h2>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">
          {canInventory && canShipping
            ? "Inventory & Shipping overview"
            : canInventory
            ? "Inventory overview"
            : canShipping
            ? "Shipping overview"
            : "Worker overview"}
        </p>
      </div>

      {!canInventory && !canShipping && (
        <div className="bg-white border border-[#B6925B]/20 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-[#FAFAFA] border border-[#B6925B]/20 flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6 text-[#B6925B]" />
          </div>
          <h3 className="font-serif text-lg text-[#4A3B2C] mb-2">No Modules Assigned</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            You don&apos;t have any worker modules yet. Ask an administrator to assign you Inventory or Shipping
            capabilities from the customer details page.
          </p>
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-white p-6 border border-[#B6925B]/20 shadow-sm flex items-center justify-between rounded-none hover:border-[#B6925B]/50 transition-colors"
              >
                <div>
                  <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-2">{stat.label}</span>
                  <span className={`text-3xl font-serif font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="w-10 h-10 bg-[#FAFAFA] border border-[#B6925B]/20 flex items-center justify-center rounded-none">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canInventory && (
          <Link href="/worker/products" className="bg-white border border-[#B6925B]/20 shadow-sm p-6 space-y-2 rounded-none hover:border-[#B6925B]/50 transition-colors">
            <div className="flex items-center gap-3">
              <Archive className="w-6 h-6 text-[#B6925B]" />
              <h3 className="font-serif text-lg text-[#4A3B2C]">Inventory Management</h3>
            </div>
            <p className="text-xs text-gray-500">Manage products, stock quantities, variants, and collections.</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mt-2">Open Inventory &rarr;</p>
          </Link>
        )}
        {canShipping && (
          <Link href="/worker/orders" className="bg-white border border-[#B6925B]/20 shadow-sm p-6 space-y-2 rounded-none hover:border-[#B6925B]/50 transition-colors">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-[#B6925B]" />
              <h3 className="font-serif text-lg text-[#4A3B2C]">Shipping Management</h3>
            </div>
            <p className="text-xs text-gray-500">Review orders and create Shiprocket shipments with AWB tracking.</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mt-2">Open Shipping &rarr;</p>
          </Link>
        )}
      </div>
    </div>
  );
}
