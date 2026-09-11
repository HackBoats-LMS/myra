"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderOpen,
  SlidersHorizontal,
  LineChart,
  Users,
  Wrench,
  Ticket,
  Truck,
  FileText,
  Settings,
  Sparkles,
  ExternalLink,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  section: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  portalType: "admin" | "worker";
  canInventory?: boolean;
  canShipping?: boolean;
  isAdmin?: boolean;
}

export default function CommandPalette({
  isOpen,
  onClose,
  portalType,
  canInventory = true,
  canShipping = true,
  isAdmin = false,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    if (portalType === "admin") {
      list.push(
        { id: "admin-dash", title: "Dashboard Overview", section: "Navigation", icon: LayoutDashboard, href: "/admin" },
        { id: "admin-analytics", title: "Analytics & Reports", section: "Navigation", icon: LineChart, href: "/admin/analytics" },
        { id: "admin-products", title: "Products Inventory", section: "Catalog", icon: Package, href: "/admin/products" },
        { id: "admin-types", title: "Product Types & Specs", section: "Catalog", icon: SlidersHorizontal, href: "/admin/product-types" },
        { id: "admin-collections", title: "Categories & Collections", section: "Catalog", icon: FolderOpen, href: "/admin/collections" },
        { id: "admin-brand", title: "Brand Stories & Media", section: "Catalog", icon: Sparkles, href: "/admin/brand-stories" },
        { id: "admin-orders", title: "Orders Management", section: "Sales & Fulfilment", icon: ShoppingCart, href: "/admin/orders" },
        { id: "admin-shipping", title: "Shipping & Courier", section: "Sales & Fulfilment", icon: Truck, href: "/admin/shipping" },
        { id: "admin-coupons", title: "Coupons & Offers", section: "Sales & Fulfilment", icon: Ticket, href: "/admin/coupons" },
        { id: "admin-customers", title: "Customers Directory", section: "Team & Customers", icon: Users, href: "/admin/customers" },
        { id: "admin-workers", title: "Staff & Workers", section: "Team & Customers", icon: Wrench, href: "/admin/workers" },
        { id: "admin-audit", title: "Audit Logs", section: "System", icon: FileText, href: "/admin/audit-logs" },
        { id: "admin-settings", title: "Store Settings", section: "System", icon: Settings, href: "/admin/settings" },
        { id: "switch-worker", title: "Switch to Worker View", section: "Quick Actions", icon: Wrench, href: "/worker", badge: "Admin" }
      );
    } else {
      list.push(
        { id: "worker-dash", title: "Worker Command Center", section: "Navigation", icon: LayoutDashboard, href: "/worker" }
      );
      if (canInventory) {
        list.push(
          { id: "worker-products", title: "Inventory & Products", section: "Inventory", icon: Package, href: "/worker/products" },
          { id: "worker-new-product", title: "Add New Product", section: "Inventory", icon: Package, href: "/worker/products/new", badge: "New" },
          { id: "worker-types", title: "Product Types & Templates", section: "Inventory", icon: SlidersHorizontal, href: "/worker/product-types" },
          { id: "worker-collections", title: "Categories & Subcategories", section: "Inventory", icon: FolderOpen, href: "/worker/collections" }
        );
      }
      if (canShipping) {
        list.push(
          { id: "worker-orders", title: "Shipping Orders Queue", section: "Fulfilment", icon: ShoppingCart, href: "/worker/orders" }
        );
      }
      if (isAdmin) {
        list.push(
          { id: "switch-admin", title: "Switch to Admin Portal", section: "Quick Actions", icon: Settings, href: "/admin", badge: "Admin" }
        );
      }
    }

    // Common actions
    list.push(
      {
        id: "view-store",
        title: "View Live Storefront",
        section: "Quick Actions",
        icon: ExternalLink,
        action: () => window.open("/", "_blank"),
      },
      {
        id: "logout",
        title: "Log Out of Portal",
        section: "Account",
        icon: LogOut,
        action: () => signOut({ callbackUrl: portalType === "admin" ? "/admin/login" : "/worker/login" }),
      }
    );

    return list;
  }, [portalType, canInventory, canShipping, isAdmin]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const handleSelect = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E1520]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white border border-[#7A0B2E]/25 shadow-2xl overflow-hidden animate-fadeIn z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#7A0B2E]/15 bg-[#FDFBF7]">
          <Search className="w-5 h-5 text-[#7A0B2E] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or jump to page..."
            className="flex-1 bg-transparent text-sm text-[#2D1F2F] placeholder-gray-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-gray-50">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No matching pages or actions found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#7A0B2E] text-white"
                      : "text-[#2D1F2F] hover:bg-[#F8F4EE]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "border-[#D4AF37]/40 bg-white/10 text-[#D4AF37]"
                          : "border-[#7A0B2E]/15 bg-[#F8F4EE] text-[#7A0B2E]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-bold tracking-wide truncate ${isSelected ? "text-white" : "text-[#2D1F2F]"}`}>
                        {item.title}
                      </p>
                      <p className={`text-[10px] tracking-wider uppercase font-semibold ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                        {item.section}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                          isSelected
                            ? "bg-white/20 text-[#D4AF37] border-[#D4AF37]/50"
                            : "bg-[#F8F4EE] text-[#7A0B2E] border-[#7A0B2E]/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest pl-2">
                        ↵
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-[#F8F6F2] border-t border-[#7A0B2E]/15 flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 font-mono text-[10px]">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-white border border-gray-300 font-mono text-[10px]">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 font-mono text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold">Myra Command</span>
        </div>
      </div>
    </div>
  );
}
