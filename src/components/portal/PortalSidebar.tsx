"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  LineChart,
  Package,
  FolderOpen,
  Image as ImageIcon,
  Sparkles,
  Star,
  ShoppingCart,
  Zap,
  RotateCcw,
  Ticket,
  Truck,
  MapPin,
  Users,
  Wrench,
  FileText,
  Settings,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  Shield,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
}

interface NavSection {
  title?: string;
  links: NavLink[];
}

interface PortalSidebarProps {
  portalType: "admin" | "worker";
  canInventory?: boolean;
  canShipping?: boolean;
  isAdmin?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  userName?: string;
}

export default function PortalSidebar({
  portalType,
  canInventory = true,
  canShipping = true,
  isAdmin = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  userName = "Staff",
}: PortalSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: portalType === "admin" ? "/admin/login" : "/worker/login" });
  };

  const isLinkActive = (href: string) => {
    if (href === "/admin" || href === "/worker") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Define navigation sections
  const sections: NavSection[] = [];

  if (portalType === "admin") {
    sections.push(
      {
        title: "Overview",
        links: [
          { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/admin/analytics", icon: LineChart, label: "Analytics" },
        ],
      },
      {
        title: "Catalog",
        links: [
          { href: "/admin/products", icon: Package, label: "Products" },
          { href: "/admin/product-types", icon: SlidersHorizontal, label: "Product Types" },
          { href: "/admin/collections", icon: FolderOpen, label: "Collections" },
          { href: "/admin/banners", icon: ImageIcon, label: "Banners & Media" },
          { href: "/admin/brand-stories", icon: Sparkles, label: "Brand Stories" },
          { href: "/admin/reviews", icon: Star, label: "Reviews" },
        ],
      },
      {
        title: "Sales & Fulfilment",
        links: [
          { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
          { href: "/admin/flash-sales", icon: Zap, label: "Flash Sales" },
          { href: "/admin/returns", icon: RotateCcw, label: "Returns & RMA" },
          { href: "/admin/coupons", icon: Ticket, label: "Coupons & Offers" },
          { href: "/admin/shipping", icon: Truck, label: "Shipping" },
          { href: "/admin/pincodes", icon: MapPin, label: "Pincodes" },
        ],
      },
      {
        title: "Customers & Team",
        links: [
          { href: "/admin/customers", icon: Users, label: "Customers" },
          { href: "/admin/workers", icon: Wrench, label: "Staff & Workers" },
        ],
      },
      {
        title: "System",
        links: [
          { href: "/admin/audit-logs", icon: FileText, label: "Audit Logs" },
          { href: "/admin/settings", icon: Settings, label: "Settings" },
        ],
      }
    );
  } else {
    // Worker navigation
    sections.push({
      title: "Overview",
      links: [{ href: "/worker", icon: LayoutDashboard, label: "Dashboard" }],
    });

    if (canInventory) {
      sections.push({
        title: "Inventory",
        links: [
          { href: "/worker/products", icon: Package, label: "Products" },
          { href: "/worker/product-types", icon: SlidersHorizontal, label: "Product Types" },
          { href: "/worker/collections", icon: FolderOpen, label: "Collections" },
        ],
      });
    }

    if (canShipping) {
      sections.push({
        title: "Fulfilment",
        links: [
          { href: "/worker/orders", icon: ShoppingCart, label: "Shipping Orders" },
        ],
      });
    }
  }

  return (
    <aside
      className={`bg-[#1E1520] text-[#FDFBF7] h-screen sticky top-0 flex flex-col transition-all duration-300 z-40 border-r border-[#7A0B2E]/30 select-none ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#160E18]">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <Link
              href={portalType === "admin" ? "/admin" : "/worker"}
              className="flex items-center gap-2.5 py-1 group min-w-0"
            >
              <Image
                src="/displaypics/footerlogo.png"
                alt="Myra Shopping Mall"
                width={112}
                height={38}
                className="h-7 w-auto object-contain brightness-105 transition-opacity group-hover:opacity-90"
                priority
              />
              <span className="text-[8px] font-mono font-bold tracking-[0.18em] text-[#D4AF37] uppercase px-1.5 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 shrink-0">
                {portalType === "admin" ? "ADMIN" : "WORKER"}
              </span>
            </Link>
            {onNavigate && (
              <button
                onClick={onNavigate}
                className="lg:hidden p-1.5 text-white/70 hover:text-white transition-colors ml-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <Link
              href={portalType === "admin" ? "/admin" : "/worker"}
              className="w-9 h-9 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
              title={portalType === "admin" ? "Myra Admin Portal" : "Myra Worker Portal"}
            >
              <div className="w-7 h-7 overflow-hidden flex items-center justify-start">
                <Image
                  src="/displaypics/footerlogo.png"
                  alt="Myra Logo"
                  width={75}
                  height={28}
                  className="h-6 w-auto max-w-none object-contain -ml-0.5"
                  priority
                />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-1 min-h-0 py-4 px-3 overflow-y-auto no-scrollbar space-y-5">
        {sections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="space-y-1">
            {!collapsed && section.title && (
              <p className="px-3 pb-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]/90 font-mono">
                {section.title}
              </p>
            )}
            {collapsed && <div className="h-px bg-white/5 mx-2 my-2" />}

            <div className="space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    title={collapsed ? link.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-all text-xs font-semibold tracking-wide relative group ${
                      active
                        ? "bg-[#7A0B2E] text-white font-bold shadow-sm"
                        : "text-[#FDFBF7]/80 hover:text-white hover:bg-white/[0.07]"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    {/* Active left indicator bar */}
                    {active && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        active
                          ? "text-[#D4AF37] opacity-100 scale-105"
                          : "opacity-75 group-hover:opacity-100 group-hover:scale-105 text-[#FDFBF7]"
                      }`}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 uppercase tracking-widest text-[11px]">
                        {link.label}
                      </span>
                    )}

                    {!collapsed && link.badge && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] font-mono font-bold">
                        {link.badge}
                      </span>
                    )}

                    {/* Tooltip on collapsed desktop */}
                    {collapsed && (
                      <div className="hidden lg:group-hover:block absolute left-full ml-3 px-2.5 py-1.5 bg-[#2D1F2F] text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-xl border border-[#7A0B2E]/40 z-50 pointer-events-none">
                        {link.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Controls & User */}
      <div className="p-3 border-t border-white/10 space-y-1 bg-[#160E18] shrink-0">
        {/* Switch portal shortcut for admins */}
        {(portalType === "admin" || isAdmin) && !collapsed && (
          <Link
            href={portalType === "admin" ? "/worker" : "/admin"}
            onClick={onNavigate}
            className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              {portalType === "admin" ? "Worker View" : "Admin Portal"}
            </span>
            <span className="text-[9px] opacity-70">Switch &rarr;</span>
          </Link>
        )}

        {/* Live storefront preview link */}
        {!collapsed && (
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
              Live Storefront
            </span>
          </Link>
        )}

        {/* User row & quick collapse */}
        <div className={`flex items-center pt-1 ${collapsed ? "justify-center flex-col gap-2" : "justify-between px-2"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-none bg-[#7A0B2E]/70 border border-[#D4AF37]/30 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                {userName.charAt(0) || "U"}
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-white truncate leading-tight">{userName}</p>
                <p className="text-[9px] text-[#D4AF37] uppercase tracking-wider font-semibold">
                  {portalType === "admin" ? "Admin" : "Worker"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-1.5 text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-colors"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
