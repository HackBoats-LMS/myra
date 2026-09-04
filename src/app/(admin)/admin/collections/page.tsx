import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Plus } from 'lucide-react';
import CollectionListTable from '@/components/shared/CollectionListTable';

export default async function AdminCollectionsPage() {
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
    console.warn("Database unreachable in AdminCollectionsPage:", error instanceof Error ? error.message : "unknown error");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 rounded-none">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Categories & Subcategories</h2>
          <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">
            Organize store hierarchy and rearrange navbar display order with Up / Down buttons
          </p>
        </div>
        <Link 
          href="/admin/collections/new" 
          className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Link>
      </div>

      <CollectionListTable initialCategories={mainCategories} basePath="/admin" />
    </div>
  );
}


