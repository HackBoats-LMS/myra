"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import DeleteButton from "./DeleteButton";
import { bulkDeleteProducts, bulkUpdateStock, deleteProduct } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { Prisma } from "@/generated/prisma";

type ProductWithCollection = Prisma.ProductGetPayload<{ include: { collection: true } }>;

export default function ProductListTable({ products }: { products: ProductWithCollection[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
    
    setIsProcessing(true);
    try {
      await bulkDeleteProducts(selectedIds);
      toast.success(`Successfully deleted ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete products.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkUpdateStock = async () => {
    const stockStr = prompt(`Enter new stock quantity for ${selectedIds.length} products:`);
    if (stockStr === null) return;
    
    const stock = parseInt(stockStr, 10);
    if (isNaN(stock) || stock < 0) {
      toast.error("Invalid stock quantity.");
      return;
    }

    setIsProcessing(true);
    try {
      await bulkUpdateStock(selectedIds, stock);
      toast.success(`Successfully updated stock for ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update stock.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FAFAFA] border border-[#B6925B]/20 p-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#4A3B2C]">
            {selectedIds.length} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkUpdateStock}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-[#B6925B]/30 text-[#4A3B2C] hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors"
            >
              Update Stock
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#B6925B]/20 relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <ArrowPathIcon className="w-8 h-8 text-[#B6925B] animate-spin" />
          </div>
        )}
        
        <table className="w-full text-left text-sm text-[#4A3B2C]">
          <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
            <tr>
              <th className="px-6 py-4 w-12 border-r border-[#B6925B]/10">
                <input
                  type="checkbox"
                  className="rounded-sm border-[#B6925B]/30 text-[#4A3B2C] focus:ring-[#B6925B]"
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Product Name</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Collection</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Price</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6925B]/10">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                  No products found. Click &ldquo;Add Product&rdquo; to create one.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-6 py-4 border-r border-[#B6925B]/10">
                    <input
                      type="checkbox"
                      className="rounded-sm border-[#B6925B]/30 text-[#4A3B2C] focus:ring-[#B6925B]"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => handleSelect(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">{product.name}</td>
                  <td className="px-6 py-4 border-r border-[#B6925B]/10">
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#B6925B]/30 text-[#B6925B]">
                      {product.collection?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">Rs. {product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 border-r border-[#B6925B]/10">
                    <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${product.stockQuantity > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {product.stockQuantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/admin/products/${product.id}`} className="inline-block text-[#B6925B] hover:text-[#4A3B2C] transition-colors p-1" title="Edit Product">
                      <PencilSquareIcon className="w-5 h-5" />
                    </Link>
                    <DeleteButton 
                      id={product.id} 
                      entityName="Product" 
                      deleteAction={deleteProduct} 
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
