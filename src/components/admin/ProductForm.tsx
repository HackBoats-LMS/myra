"use client";
import { useState } from "react";
import { createProduct, updateProduct } from "@/actions/admin";
import ImageUpload from "./ImageUpload";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import AdminForm from "./AdminForm";
import type { Collection, Prisma } from "@/generated/prisma";

interface ProductVariant {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  stockQuantity: number;
  priceOffset: number;
}

interface ProductFormProps {
  collections: Collection[];
  initialData?: Prisma.ProductGetPayload<{ include: { variants: true } }>;
}

export default function ProductForm({ collections, initialData }: ProductFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [variants, setVariants] = useState<ProductVariant[]>(initialData?.variants || []);

  const addVariant = () => {
    setVariants([...variants, { id: "", sku: "", size: "", color: "", stockQuantity: 0, priceOffset: 0 }]);
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <AdminForm
      initialData={initialData}
      createAction={createProduct}
      updateAction={updateProduct}
      onSuccessRedirect="/admin/products"
      successMessage={initialData ? "Product updated!" : "Product created!"}
      errorMessage="Failed to save product. Please try again."
    >
      {() => (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images ({images.length}/5)</label>
              <div className="flex flex-wrap gap-4 items-center">
                {images.map((url, index) => (
                  <div key={index} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 group">
                    <Image fill src={url} alt={`Upload ${index + 1}`} className="object-cover" />
                    
                    {/* Reorder Buttons (Hover) */}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent pt-4">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          const newImages = [...images];
                          [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                          setImages(newImages);
                        }}
                        className="text-white disabled:opacity-30 hover:text-blue-300 p-1 rounded"
                        aria-label="Move image left"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => {
                          const newImages = [...images];
                          [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                          setImages(newImages);
                        }}
                        className="text-white disabled:opacity-30 hover:text-blue-300 p-1 rounded"
                        aria-label="Move image right"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm transition-colors"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <div className="w-28 h-28 border border-gray-200 rounded-lg overflow-hidden">
                    <ImageUpload value="" onChange={(url) => { if (url) setImages(prev => [...prev, url]) }} />
                  </div>
                )}
              </div>
              {images.length >= 5 && (
                <p className="text-xs text-amber-600 mt-2 font-medium">Maximum limit of 5 images reached.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required defaultValue={initialData?.name} name="name" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL friendly)</label>
                <input required defaultValue={initialData?.slug} name="slug" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required defaultValue={initialData?.description} name="description" rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                <input required defaultValue={initialData?.price} name="price" type="number" step="0.01" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Stock</label>
                <input required defaultValue={initialData?.stockQuantity} name="stockQuantity" type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                <select name="collectionId" defaultValue={initialData?.collectionId || ""} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50">
                  <option value="">None</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Variants Section */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Product Variants</h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-xs font-bold uppercase tracking-wider text-[#0D3B66] hover:underline"
                >
                  + Add Variant
                </button>
              </div>
              
              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No variants added. This product will be sold as a single standard item.</p>
              ) : (
                <div className="space-y-4">
                  {variants.map((v, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Size</label>
                        <input value={v.size || ""} onChange={e => updateVariant(index, "size", e.target.value)} type="text" placeholder="e.g. M" className="w-full mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-[#0D3B66]" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Color</label>
                        <input value={v.color || ""} onChange={e => updateVariant(index, "color", e.target.value)} type="text" placeholder="e.g. Red" className="w-full mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-[#0D3B66]" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">SKU</label>
                        <input value={v.sku || ""} onChange={e => updateVariant(index, "sku", e.target.value)} type="text" placeholder="SKU-123" className="w-full mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-[#0D3B66]" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Stock</label>
                        <input value={v.stockQuantity} onChange={e => updateVariant(index, "stockQuantity", e.target.value)} type="number" className="w-full mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-[#0D3B66]" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Price Offset (₹)</label>
                        <input value={v.priceOffset} onChange={e => updateVariant(index, "priceOffset", e.target.value)} type="number" step="0.01" className="w-full mt-1 rounded border border-gray-300 px-2 py-1 text-xs focus:ring-[#0D3B66]" />
                      </div>
                      <div className="col-span-1 flex justify-end mt-5">
                        <button type="button" onClick={() => removeVariant(index)} className="text-red-500 hover:text-red-700 p-1">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="images" value={JSON.stringify(images)} />
          <input type="hidden" name="variants" value={JSON.stringify(variants)} />
        </>
      )}
    </AdminForm>
  );
}