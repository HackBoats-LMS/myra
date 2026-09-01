import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireWorkerModule } from "@/lib/worker";
import { Plus } from "lucide-react";
import CollectionListTable from "@/components/shared/CollectionListTable";

export const dynamic = "force-dynamic";

export default async function WorkerCollectionsPage() {
  await requireWorkerModule("inventory");
  let mainCategories: any[] = [];
  try {
    mainCategories = await prisma.collection.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            _count: { select: { products: true } }
          },
          orderBy: [{ order: "asc" }, { name: "asc" }]
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    });
  } catch (error) {
    console.warn("Database unreachable in WorkerCollectionsPage:", error instanceof Error ? error.message : "unknown error");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 rounded-none">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Categories & Subcategories</h2>
          <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">
            Organize products and rearrange navbar display order with Up / Down buttons
          </p>
        </div>
        <Link href="/worker/collections/new" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none">
          <Plus className="w-4 h-4" />
          Add Category
        </Link>
      </div>

      <CollectionListTable initialCategories={mainCategories} basePath="/worker" />
    </div>
  );
}

