"use client";
import PortalShell from "@/components/portal/PortalShell";

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}) {
  return (
    <PortalShell portalType="admin" user={user}>
      {children}
    </PortalShell>
  );
}
