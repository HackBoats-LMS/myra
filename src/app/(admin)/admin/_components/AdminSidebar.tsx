"use client";
import Link from 'next/link';
import { signOut } from 'next-auth/react';
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
  X,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: SidebarProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  const sections: { title: string; links: { href: string; icon: LucideIcon; label: string }[] }[] = [
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
        { href: "/admin/returns", icon: RotateCcw, label: "Returns & Replacements" },
        { href: "/admin/coupons", icon: Ticket, label: "Coupons & Offers" },
        { href: "/admin/shipping", icon: Truck, label: "Shipping" },
        { href: "/admin/pincodes", icon: MapPin, label: "Pincodes" },
      ],
    },
    {
      title: "Customers",
      links: [
        { href: "/admin/customers", icon: Users, label: "Customers" },
        { href: "/admin/workers", icon: Wrench, label: "Workers" },
      ],
    },
    {
      title: "System",
      links: [
        { href: "/admin/audit-logs", icon: FileText, label: "Audit Logs" },
        { href: "/admin/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#4A3B2C] text-white h-screen sticky top-0 overflow-hidden flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-[#B6925B]/20 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif tracking-widest text-[#FAFAFA]">MYRA</h2>
          <p className="text-[10px] tracking-widest text-[#B6925B] uppercase mt-1 font-bold">Admin Panel</p>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="lg:hidden p-1 text-[#B6925B] hover:text-white transition-colors flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <nav className="flex-1 min-h-0 p-4 mt-4 overflow-y-auto no-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-4 mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#B6925B]">{section.title}</p>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-none hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    <IconComponent className="w-4 h-4 opacity-80 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[#B6925B]/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-none hover:bg-red-500/20 text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 opacity-80 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
