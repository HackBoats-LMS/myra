"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Archive,
  FolderOpen,
  ShoppingCart,
  Shield,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  onNavigate?: () => void;
  canInventory: boolean;
  canShipping: boolean;
}

interface NavLinkItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export default function WorkerSidebar({ onNavigate, canInventory, canShipping }: SidebarProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/worker/login" });
  };

  const links: NavLinkItem[] = [
    { href: "/worker", icon: LayoutDashboard, label: "Dashboard" },
    ...(canInventory
      ? [
          { href: "/worker/products", icon: Archive, label: "Inventory" },
          { href: "/worker/collections", icon: FolderOpen, label: "Collections" },
        ]
      : []),
    ...(canShipping ? [{ href: "/worker/orders", icon: ShoppingCart, label: "Shipping" }] : []),
  ];

  return (
    <aside className="w-64 bg-[#4A3B2C] text-white min-h-screen flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-[#B6925B]/20 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif tracking-widest text-[#FAFAFA]">MYRA</h2>
          <p className="text-[10px] tracking-widest text-[#B6925B] uppercase mt-1 font-bold">Multi-Worker</p>
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

      <nav className="flex-1 p-4 space-y-1 mt-4">
        <p className="px-4 pb-2 text-[9px] text-[#B6925B]/70 uppercase tracking-widest font-bold">Management</p>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-3 rounded-none hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <Icon className="w-4 h-4 opacity-70" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#B6925B]/20">
        <Link
          href="/admin/login"
          className="flex items-center gap-3 px-4 py-3 rounded-none hover:bg-[#B6925B]/20 text-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <Shield className="w-4 h-4 opacity-70" />
          Admin Portal
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-none hover:bg-red-500/20 text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 opacity-70" />
          Logout
        </button>
      </div>
    </aside>
  );
}
