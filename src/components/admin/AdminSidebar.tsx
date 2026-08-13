"use client";
import Link from 'next/link';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: SidebarProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  const links = [
    { href: "/admin", icon: "ri-dashboard-3-line", label: "Dashboard" },
    { href: "/admin/products", icon: "ri-archive-line", label: "Products" },
    { href: "/admin/collections", icon: "ri-folder-open-line", label: "Collections" },
    { href: "/admin/orders", icon: "ri-shopping-cart-2-line", label: "Orders" },
    { href: "/admin/customers", icon: "ri-group-line", label: "Customers" },
    { href: "/admin/reviews", icon: "ri-star-line", label: "Reviews" },
    { href: "/admin/audit-logs", icon: "ri-file-list-3-line", label: "Audit Logs" },
  ];

  return (
    <aside className="w-64 bg-[#4A3B2C] text-white min-h-screen flex flex-col shadow-xl z-50">
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
            <i className="ri-close-line text-2xl" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 rounded-none hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <i className={`${link.icon} text-sm opacity-70`} />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[#B6925B]/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-none hover:bg-red-500/20 text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <i className="ri-logout-box-r-line text-sm opacity-70" />
          Logout
        </button>
      </div>
    </aside>
  );
}
