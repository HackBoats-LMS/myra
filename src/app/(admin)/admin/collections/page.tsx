import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteCollection } from '@/actions/admin';
import { Prisma } from '@/generated/prisma';

export default async function AdminCollectionsPage() {
  let collections: Prisma.CollectionGetPayload<{
    include: { _count: { select: { products: true } } }
  }>[] = [];
  try {
    collections = await prisma.collection.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.warn("Database unreachable in AdminCollectionsPage:", error);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 rounded-none">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Collections</h2>
          <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Organize your products into categories</p>
        </div>
        <Link href="/admin/collections/new" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none">
          <i className="ri-plus-line text-sm" />
          Add Collection
        </Link>
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative rounded-none">
        <table className="w-full text-left text-sm text-[#4A3B2C]">
          <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Collection Name</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Slug</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Total Products</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6925B]/10">
            {collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No collections found. Click &ldquo;Add Collection&rdquo; to create one.
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">{collection.name}</td>
                  <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#B6925B] border-r border-[#B6925B]/10">{collection.slug}</td>
                  <td className="px-6 py-4 border-r border-[#B6925B]/10">
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#B6925B]/30 text-[#B6925B] rounded-none">
                      {collection._count.products} products
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/admin/collections/${collection.id}`} className="inline-flex text-[#B6925B] hover:text-[#4A3B2C] transition-colors p-1 items-center justify-center rounded-none" title="Edit Collection">
                      <i className="ri-edit-box-line text-lg" />
                    </Link>
                    <DeleteButton 
                      id={collection.id} 
                      entityName="Collection" 
                      deleteAction={deleteCollection} 
                      confirmMessage={`Are you sure you want to delete ${collection.name}? This will NOT delete the products inside it, but will remove them from the collection.`}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
