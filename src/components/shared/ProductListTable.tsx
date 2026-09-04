"use client";
import { useState } from "react";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import { bulkDeleteProducts, bulkUpdateStock, deleteProduct, restoreProduct, bulkRestoreProducts } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import type { Prisma } from "@/generated/prisma";
import { Loader2, Pencil, RefreshCw } from "lucide-react";

type ProductWithCollection = Prisma.ProductGetPayload<{ include: { collection: true } }>;

export default function ProductListTable({
  products,
  basePath = "/admin/products",
  archived = false,
}: {
  products: ProductWithCollection[];
  basePath?: string;
  archived?: boolean;
}) {
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

  const handleBulkRestore = async () => {
    setIsProcessing(true);
    try {
      await bulkRestoreProducts(selectedIds);
      toast.success(`Successfully restored ${selectedIds.length} products.`);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore products.");
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
        <div className="bg-[#FAFAFA] border border-[#7A0B2E]/20 p-3 flex items-center justify-between rounded-none">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2D1F2F]">
            {selectedIds.length} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            {archived ? (
              <button
                onClick={handleBulkRestore}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 transition-colors rounded-none"
              >
                Restore
              </button>
            ) : (
              <>
                <button
                  onClick={handleBulkUpdateStock}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-[#7A0B2E]/30 text-[#2D1F2F] hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors rounded-none"
                >
                  Update Stock
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors rounded-none"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-[#7A0B2E]/20 relative rounded-none">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[#7A0B2E] animate-spin" />
          </div>
        )}
        
        <table className="w-full text-left text-sm text-[#2D1F2F]">
          <thead className="bg-[#FAFAFA] text-[#7A0B2E] text-[10px] uppercase font-bold tracking-widest border-b border-[#7A0B2E]/20">
            <tr>
              <th className="px-6 py-4 w-12 border-r border-[#7A0B2E]/10">
                <input
                  type="checkbox"
                  className="rounded-none border-[#7A0B2E]/30 text-[#2D1F2F] focus:ring-[#7A0B2E]"
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Product Code</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Product Name</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Collection</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Price</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7A0B2E]/10">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No products found. Click &ldquo;Add Product&rdquo; to create one.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <input
                      type="checkbox"
                      className="rounded-none border-[#7A0B2E]/30 text-[#2D1F2F] focus:ring-[#7A0B2E]"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => handleSelect(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <span className="inline-flex items-center font-mono text-[10px] font-bold tracking-widest text-[#7A0B2E]">
                      {product.code || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10">{product.name}</td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-white border border-[#7A0B2E]/30 text-[#7A0B2E] rounded-none">
                      {product.collection?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10">Rs. {product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-none ${product.stockQuantity > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {product.stockQuantity} in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`${basePath}/${product.id}`} className="flex items-center justify-center text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors p-1 rounded-none" title="Edit Product">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      {archived ? (
                        <button
                          onClick={async () => {
                            try {
                              await restoreProduct(product.id);
                              toast.success("Product restored.");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Failed to restore product.");
                            }
                          }}
                          className="flex items-center justify-center text-green-600 hover:text-green-800 transition-colors p-1 rounded-none"
                          title="Restore Product"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <DeleteButton 
                          id={product.id} 
                          entityName="Product" 
                          deleteAction={deleteProduct} 
                        />
                      )}
                    </div>
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
