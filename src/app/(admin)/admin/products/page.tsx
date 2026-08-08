import Link from 'next/link';
import { getProducts } from '@/services/products';
import { Plus, Edit } from 'lucide-react';
import DeleteProductButton from '@/components/admin/DeleteProductButton';

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Products</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your storefront inventory</p>
        </div>
        <Link href="/admin/products/new" className="bg-[#B03138] hover:bg-[#8F252B] text-white px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Collection</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {product.collection?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">₹{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.stockQuantity > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {product.stockQuantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/products/${product.id}`} className="inline-block text-gray-400 hover:text-[#0D3B66] transition-colors p-1" title="Edit Product">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} />
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
