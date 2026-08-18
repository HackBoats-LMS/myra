"use client";
import { useState } from "react";
import WorkerSidebar from "./WorkerSidebar";

export default function WorkerShell({
  children,
  canInventory,
  canShipping,
}: {
  children: React.ReactNode;
  canInventory: boolean;
  canShipping: boolean;
}) {
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
        <h1 className="text-xs font-bold text-[#4A3B2C] tracking-widest uppercase">Myra Multi-Worker</h1>
        <span className="w-9" />
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <WorkerSidebar
            canInventory={canInventory}
            canShipping={canShipping}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0">
        <WorkerSidebar canInventory={canInventory} canShipping={canShipping} />
      </div>

      <div className="flex flex-col lg:ml-64">
        {/* Desktop header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-[#B6925B]/20 items-center px-8 shadow-sm">
          <h1 className="text-xs font-bold text-[#4A3B2C] tracking-widest uppercase">
            Inventory & Shipping Panel
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}