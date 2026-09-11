"use client";
import { useState, useEffect } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import CommandPalette from "./CommandPalette";

interface PortalShellProps {
  children: React.ReactNode;
  portalType: "admin" | "worker";
  canInventory?: boolean;
  canShipping?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function PortalShell({
  children,
  portalType,
  canInventory = true,
  canShipping = true,
  user,
}: PortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Restore sidebar collapse preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("myra_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("myra_sidebar_collapsed", String(next));
    } catch {
      // Ignore
    }
  };

  // Register Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const userName = user?.name || (portalType === "admin" ? "Admin" : "Worker");
  const userEmail = user?.email || "";
  const userRole = user?.role || (portalType === "admin" ? "ADMIN" : "MULTI_WORKER");

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#2D1F2F] flex flex-col font-sans">
      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-[#1E1520]/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute left-0 top-0 bottom-0 transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <PortalSidebar
            portalType={portalType}
            canInventory={canInventory}
            canShipping={canShipping}
            isAdmin={isAdmin}
            onNavigate={() => setMobileOpen(false)}
            userName={userName}
          />
        </div>
      </div>

      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-40">
        <PortalSidebar
          portalType={portalType}
          canInventory={canInventory}
          canShipping={canShipping}
          isAdmin={isAdmin}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          userName={userName}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "lg:ml-18" : "lg:ml-64"
        }`}
      >
        <PortalHeader
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          portalType={portalType}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          isAdmin={isAdmin}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        portalType={portalType}
        canInventory={canInventory}
        canShipping={canShipping}
        isAdmin={isAdmin}
      />
    </div>
  );
}
