"use client";
import PortalShell from "@/components/portal/PortalShell";

export default function WorkerShell({
  children,
  canInventory,
  canShipping,
  user,
}: {
  children: React.ReactNode;
  canInventory: boolean;
  canShipping: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}) {
  return (
    <PortalShell
      portalType="worker"
      canInventory={canInventory}
      canShipping={canShipping}
      user={user}
    >
      {children}
    </PortalShell>
  );
}
