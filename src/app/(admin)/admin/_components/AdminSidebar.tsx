"use client";
import PortalSidebar from "@/components/portal/PortalSidebar";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: SidebarProps) {
  return (
    <PortalSidebar
      portalType="admin"
      onNavigate={onNavigate}
      userName="Admin"
    />
  );
}
