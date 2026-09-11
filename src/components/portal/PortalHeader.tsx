"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  Search,
  ExternalLink,
  ChevronDown,
  Shield,
  Wrench,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface PortalHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  portalType: "admin" | "worker";
  userName?: string;
  userEmail?: string;
  userRole?: string;
  isAdmin?: boolean;
}

export default function PortalHeader({
  onOpenMobileMenu,
  onOpenCommandPalette,
  portalType,
  userName = "Staff Member",
  userEmail = "",
  userRole = "ADMIN",
  isAdmin = false,
}: PortalHeaderProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format breadcrumbs from pathname
  const breadcrumbSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((seg, idx, arr) => {
      const href = "/" + arr.slice(0, idx + 1).join("/");
      let label = seg
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      // Custom labels for standard paths
      if (seg === "admin") label = "Admin";
      else if (seg === "worker") label = "Worker";
      else if (seg === "new") label = "New";
      else if (seg.length > 20) label = "#" + seg.slice(0, 8); // IDs

      return { label, href, isLast: idx === arr.length - 1 };
    });

  const handleLogout = async () => {
    await signOut({ callbackUrl: portalType === "admin" ? "/admin/login" : "/worker/login" });
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FDFBF7] border-b border-[#7A0B2E]/15 px-4 md:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#2D1F2F] hover:text-[#7A0B2E] transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate">
          <Link
            href={portalType === "admin" ? "/admin" : "/worker"}
            className="hover:text-[#7A0B2E] text-[11px] font-bold uppercase tracking-wider transition-colors text-gray-400"
          >
            {portalType === "admin" ? "Admin" : "Worker"}
          </Link>
          {breadcrumbSegments.slice(1).map((seg) => (
            <div key={seg.href} className="flex items-center gap-1.5 truncate">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              {seg.isLast ? (
                <span className="font-bold text-[#2D1F2F] uppercase tracking-wider text-[11px] truncate">
                  {seg.label}
                </span>
              ) : (
                <Link
                  href={seg.href}
                  className="hover:text-[#7A0B2E] text-[11px] uppercase tracking-wider transition-colors truncate"
                >
                  {seg.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile title */}
        <span className="sm:hidden font-serif font-bold text-sm text-[#2D1F2F] tracking-wider truncate">
          MYRA {portalType === "admin" ? "ADMIN" : "WORKER"}
        </span>
      </div>

      {/* Right: Quick Search / Command Palette trigger + Storefront Link + Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Command Palette trigger button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#7A0B2E]/20 text-gray-500 hover:text-[#2D1F2F] hover:border-[#7A0B2E]/40 text-xs transition-colors shadow-2xs group"
          title="Quick Search (Ctrl+K or ⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-[#7A0B2E]" />
          <span className="hidden md:inline font-medium text-gray-400 group-hover:text-gray-600">
            Search or jump to...
          </span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold text-gray-400 bg-gray-100 border border-gray-200">
            ⌘K
          </kbd>
        </button>

        {/* Live Storefront Button */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#7A0B2E]/20 text-[#2D1F2F] hover:text-[#7A0B2E] hover:border-[#7A0B2E]/40 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-2xs"
          title="View Live Customer Storefront"
        >
          <span>Store</span>
          <ExternalLink className="w-3 h-3 text-[#7A0B2E]" />
        </Link>

        {/* Profile / Role Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-black/5 transition-colors"
            aria-expanded={profileOpen}
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-[#7A0B2E] border border-[#D4AF37]/50 flex items-center justify-center text-xs font-bold text-white shadow-2xs uppercase">
              {userName.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-[#2D1F2F] leading-tight truncate max-w-[120px]">
                {userName}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#7A0B2E]">
                {userRole === "ADMIN" ? "Administrator" : "Staff"}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#7A0B2E]/20 shadow-xl py-2 z-50 animate-fadeIn">
              {/* User summary */}
              <div className="px-4 py-3 border-b border-gray-100 bg-[#FDFBF7]">
                <p className="text-xs font-bold text-[#2D1F2F] truncate">{userName}</p>
                {userEmail && <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>}
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#7A0B2E]/10 border border-[#7A0B2E]/20 text-[9px] font-bold uppercase tracking-widest text-[#7A0B2E]">
                  {userRole === "ADMIN" ? (
                    <>
                      <Shield className="w-3 h-3 text-[#7A0B2E]" /> Super Admin
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3 h-3 text-[#7A0B2E]" /> Multi-Worker
                    </>
                  )}
                </div>
              </div>

              {/* Portal switcher for Admins */}
              {isAdmin && (
                <div className="py-1 border-b border-gray-100">
                  <Link
                    href={portalType === "admin" ? "/worker" : "/admin"}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#2D1F2F] hover:bg-[#F8F4EE] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {portalType === "admin" ? (
                        <>
                          <Wrench className="w-4 h-4 text-[#7A0B2E]" /> Switch to Worker Panel
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 text-[#7A0B2E]" /> Switch to Admin Panel
                        </>
                      )}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">&rarr;</span>
                  </Link>
                </div>
              )}

              {/* Direct links */}
              <div className="py-1 border-b border-gray-100">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:text-[#2D1F2F] hover:bg-[#F8F4EE] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  View Storefront
                </Link>
              </div>

              {/* Logout button */}
              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
