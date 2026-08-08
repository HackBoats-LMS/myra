import Link from 'next/link';
import { Package, LayoutDashboard, FolderTree, ShoppingCart, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0D3B66] text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 shadow-xl z-50">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-black tracking-wider text-white">MYRA</h2>
        <p className="text-[10px] tracking-widest text-[#F2EFE8] uppercase opacity-80 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 transition-colors text-sm font-medium">
          <LayoutDashboard className="w-4 h-4 opacity-70" />
          Dashboard
        </Link>
        <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 transition-colors text-sm font-medium">
          <Package className="w-4 h-4 opacity-70" />
          Products
        </Link>
        <Link href="/admin/collections" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 transition-colors text-sm font-medium">
          <FolderTree className="w-4 h-4 opacity-70" />
          Collections
        </Link>
        <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 transition-colors text-sm font-medium">
          <ShoppingCart className="w-4 h-4 opacity-70" />
          Orders
        </Link>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-md hover:bg-red-500/20 text-red-300 transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4 opacity-70" />
          Logout
        </button>
      </div>
    </aside>
  );
}
