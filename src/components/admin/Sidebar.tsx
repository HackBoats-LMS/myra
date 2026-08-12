import Link from 'next/link';
import { ArchiveBoxIcon, Squares2X2Icon, FolderOpenIcon, ShoppingCartIcon, ArrowRightOnRectangleIcon, UsersIcon, StarIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#4A3B2C] text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 shadow-xl z-50">
      <div className="p-6 border-b border-[#B6925B]/20">
        <h2 className="text-2xl font-serif tracking-widest text-[#FAFAFA]">MYRA</h2>
        <p className="text-[10px] tracking-widest text-[#B6925B] uppercase mt-1 font-bold">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4">
        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <Squares2X2Icon className="w-4 h-4 opacity-70" />
          Dashboard
        </Link>
        <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <ArchiveBoxIcon className="w-4 h-4 opacity-70" />
          Products
        </Link>
        <Link href="/admin/collections" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <FolderOpenIcon className="w-4 h-4 opacity-70" />
          Collections
        </Link>
        <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <ShoppingCartIcon className="w-4 h-4 opacity-70" />
          Orders
        </Link>
        <Link href="/admin/customers" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <UsersIcon className="w-4 h-4 opacity-70" />
          Customers
        </Link>
        <Link href="/admin/reviews" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <StarIcon className="w-4 h-4 opacity-70" />
          Reviews
        </Link>
        <Link href="/admin/audit-logs" className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-[#B6925B] transition-colors text-xs font-bold uppercase tracking-widest">
          <ClipboardDocumentListIcon className="w-4 h-4 opacity-70" />
          Audit Logs
        </Link>
      </nav>

      <div className="p-4 border-t border-[#B6925B]/20">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-sm hover:bg-red-500/20 text-red-300 transition-colors text-xs font-bold uppercase tracking-widest">
          <ArrowRightOnRectangleIcon className="w-4 h-4 opacity-70" />
          Logout
        </button>
      </div>
    </aside>
  );
}
