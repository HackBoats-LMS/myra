import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus, Edit } from 'lucide-react';
import DeleteCollectionButton from '@/components/admin/DeleteCollectionButton';

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Collections</h2>
          <p className="text-sm text-gray-500 mt-1">Organize your products into categories</p>
        </div>
        <Link href="/admin/collections/new" className="bg-[#B03138] hover:bg-[#8F252B] text-white px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Collection
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Collection Name</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Total Products</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No collections found. Click "Add Collection" to create one.
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{collection.name}</td>
                  <td className="px-6 py-4 text-gray-500">{collection.slug}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {collection._count.products} products
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/collections/${collection.id}`} className="inline-block text-gray-400 hover:text-[#0D3B66] transition-colors p-1" title="Edit Collection">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteCollectionButton id={collection.id} name={collection.name} />
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
