"use client";
import PortalSidebar from "@/components/portal/PortalSidebar";

interface SidebarProps {
  onNavigate?: () => void;
  canInventory: boolean;
  canShipping: boolean;
}

export default function WorkerSidebar({ onNavigate, canInventory, canShipping }: SidebarProps) {
  return (
    <PortalSidebar
      portalType="worker"
      canInventory={canInventory}
      canShipping={canShipping}
      onNavigate={onNavigate}
      userName="Worker"
    />
  );
}
