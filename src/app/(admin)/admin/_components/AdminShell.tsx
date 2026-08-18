"use client";
import { useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import type { SidebarSection } from "@/components/ui/Sidebar";

const sections: SidebarSection[] = [
  {
    title: "Overview",
    links: [
      { href: "/admin", icon: "ri-dashboard-3-line", label: "Dashboard" },
      { href: "/admin/analytics", icon: "ri-line-chart-line", label: "Analytics" },
    ],
  },
  {
    title: "Catalog",
    links: [
      { href: "/admin/products", icon: "ri-archive-line", label: "Products" },
      { href: "/admin/collections", icon: "ri-folder-open-line", label: "Collections" },
      { href: "/admin/reviews", icon: "ri-star-line", label: "Reviews" },
    ],
  },
  {
    title: "Sales & Fulfilment",
    links: [
      { href: "/admin/orders", icon: "ri-shopping-cart-2-line", label: "Orders" },
      { href: "/admin/flash-sales", icon: "ri-flashlight-line", label: "Flash Sales" },
      { href: "/admin/returns", icon: "ri-refund-2-line", label: "Returns & Replacements" },
      { href: "/admin/coupons", icon: "ri-ticket-2-line", label: "Coupons & Offers" },
      { href: "/admin/shipping", icon: "ri-truck-line", label: "Shipping" },
      { href: "/admin/pincodes", icon: "ri-map-pin-line", label: "Pincodes" },
    ],
  },
  {
    title: "Customers",
    links: [
      { href: "/admin/customers", icon: "ri-group-line", label: "Customers" },
      { href: "/admin/workers", icon: "ri-tools-line", label: "Workers" },
    ],
  },
  {
    title: "System",
    links: [
      { href: "/admin/audit-logs", icon: "ri-file-list-3-line", label: "Audit Logs" },
      { href: "/admin/settings", icon: "ri-settings-3-line", label: "Settings" },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA]">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 h-16 bg-white border-b border-[#B6925B]/20 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="p-2 text-[#4A3B2C] hover:text-[#B6925B] transition-colors flex items-center justify-center"
          aria-label="Open menu"
        >
          <i className="ri-menu-line text-2xl leading-none" />
        </button>
        <h1 className="text-xs font-bold text-[#4A3B2C] tracking-widest uppercase">Myra Admin</h1>
        <span className="w-9" />
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar subtitle="Admin Panel" sections={sections} logoutCallbackUrl="/admin/login" onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0">
        <Sidebar subtitle="Admin Panel" sections={sections} logoutCallbackUrl="/admin/login" />
      </div>

      <div className="flex flex-col lg:ml-64">
        {/* Desktop header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-[#B6925B]/20 items-center px-8 shadow-sm">
          <h1 className="text-xs font-bold text-[#4A3B2C] tracking-widest uppercase">
            Welcome back, Admin
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
