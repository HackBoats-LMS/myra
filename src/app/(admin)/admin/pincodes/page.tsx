import { prisma } from "@/lib/db/prisma";
import PincodeManager from "@/app/(admin)/admin/pincodes/_components/PincodeManager";

export const dynamic = "force-dynamic";

export default async function AdminPincodesPage() {
  let pincodes: Awaited<ReturnType<typeof prisma.pincode.findMany>> = [];

  try {
    pincodes = await prisma.pincode.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    console.warn("Database unreachable in AdminPincodesPage:", error instanceof Error ? error.message : "unknown error");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-[#7A0B2E]/20 pb-4">
        <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Pincode Availability</h2>
        <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">
          Manage the pincodes where delivery is available
        </p>
      </div>

      <PincodeManager pincodes={pincodes} />
    </div>
  );
}
