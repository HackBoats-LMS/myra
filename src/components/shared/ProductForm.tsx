"use client";
import { useReducer } from "react";
import { createProduct, updateProduct } from "@/actions/admin";
import ImageUpload from "@/app/(admin)/admin/_components/ImageUpload";
import Image from "next/image";
import AdminForm from "@/app/(admin)/admin/_components/AdminForm";
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

type ImagesAction =
  | { type: "ADD"; url: string }
  | { type: "REMOVE"; index: number }
  | { type: "MOVE"; from: number; to: number };

function imagesReducer(state: string[], action: ImagesAction): string[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.url];
    case "REMOVE":
      return state.filter((_, i) => i !== action.index);
    case "MOVE": {
      const next = [...state];
      [next[action.from], next[action.to]] = [next[action.to], next[action.from]];
      return next;
    }
    default:
      return state;
  }
}

type VariantsAction =
  | { type: "ADD" }
  | { type: "UPDATE"; index: number; field: string; value: string | number }
  | { type: "REMOVE"; index: number };

const emptyVariant = (): ProductVariant => ({ id: "", sku: "", size: "", color: "", stockQuantity: 0, priceOffset: 0 });

function variantsReducer(state: ProductVariant[], action: VariantsAction): ProductVariant[] {
  switch (action.type) {
    case "ADD":
      return [...state, emptyVariant()];
    case "UPDATE":
      return state.map((v, i) =>
        i === action.index ? { ...v, [action.field]: action.value } : v
      );
    case "REMOVE":
      return state.filter((_, i) => i !== action.index);
    default:
      return state;
  }
}

export default function ProductForm({ collections, initialData }: ProductFormProps) {
  const [images, dispatchImages] = useReducer(imagesReducer, initialData?.images || []);
  const [variants, dispatchVariants] = useReducer(variantsReducer, initialData?.variants || []);

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
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Product Images ({images.length}/5)</label>
              <div className="flex flex-wrap gap-4 items-center">
                {images.map((url, index) => (
                  <div key={index} className="relative w-28 h-28 rounded-none overflow-hidden border border-[#B6925B]/20 shadow-sm flex-shrink-0 group">
                    <Image fill src={url} alt={`Upload ${index + 1}`} className="object-cover" />

                    {/* Reorder Buttons (Hover) */}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent pt-4">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => dispatchImages({ type: "MOVE", from: index, to: index - 1 })}
                        className="text-white disabled:opacity-30 hover:text-[#B6925B] p-1 rounded flex items-center justify-center"
                        aria-label="Move image left"
                      >
                        <i className="ri-arrow-left-s-line text-lg" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => dispatchImages({ type: "MOVE", from: index, to: index + 1 })}
                        className="text-white disabled:opacity-30 hover:text-[#B6925B] p-1 rounded flex items-center justify-center"
                        aria-label="Move image right"
                      >
                        <i className="ri-arrow-right-s-line text-lg" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => dispatchImages({ type: "REMOVE", index })}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 hover:bg-red-600 shadow-sm transition-colors flex items-center justify-center rounded-none"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <div className="w-28 h-28 border border-[#B6925B]/20 rounded-none overflow-hidden">
                    <ImageUpload value="" onChange={(url) => { if (url) dispatchImages({ type: "ADD", url }) }} />
                  </div>
                )}
              </div>
              {images.length >= 5 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-2">Maximum limit of 5 images reached.</p>
              )}
            </div>

            <div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Name</label>
                <input required defaultValue={initialData?.name} name="name" type="text" className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
                {initialData?.code && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mt-1">Product Code: {initialData.code}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Description</label>
              <textarea required defaultValue={initialData?.description} name="description" rows={4} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Base Price (Original ₹)</label>
                <input defaultValue={initialData?.originalPrice ?? ""} name="originalPrice" type="number" step="0.01" className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="e.g. 1999" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Discount Price (Selling ₹)</label>
                <input required defaultValue={initialData?.price} name="price" type="number" step="0.01" className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="e.g. 1499" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Default Stock</label>
                <input required defaultValue={initialData?.stockQuantity} name="stockQuantity" type="number" className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Category</label>
                <select name="collectionId" defaultValue={initialData?.collectionId || ""} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]">
                  <option value="">Select category</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Product Type</label>
                <select name="productType" defaultValue={initialData?.productType || ""} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]">
                  <option value="">Select type</option>
                  {["Saree", "Dress", "Top", "Bottom", "Kurti / Ethnic", "Kids Wear"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Material / Fabric</label>
                <input defaultValue={initialData?.material || ""} name="material" type="text" placeholder="e.g. Pure Silk" className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Weight</label>
                <input defaultValue={initialData?.weight || ""} name="weight" type="text" placeholder="e.g. 500 g" className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Video URL (optional)</label>
              <input defaultValue={initialData?.videoUrl || ""} name="videoUrl" type="url" placeholder="https://..." className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
            </div>

            {/* Variants Section */}
            <div className="pt-6 border-t border-[#B6925B]/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[#4A3B2C] uppercase tracking-widest">Product Variants</h3>
                <button
                  type="button"
                  onClick={() => dispatchVariants({ type: "ADD" })}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors"
                >
                  + Add Variant
                </button>
              </div>

              {variants.length === 0 ? (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">No variants added. This product will be sold as a single standard item.</p>
              ) : (
                <div className="space-y-4">
                  {variants.map((v, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start bg-[#FAFAFA] p-3 rounded-none border border-[#B6925B]/20">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Size</label>
                        <input value={v.size || ""} onChange={e => dispatchVariants({ type: "UPDATE", index, field: "size", value: e.target.value })} type="text" placeholder="e.g. M" className="w-full mt-2 rounded-none border border-[#B6925B]/20 bg-white px-2 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Color</label>
                        <input value={v.color || ""} onChange={e => dispatchVariants({ type: "UPDATE", index, field: "color", value: e.target.value })} type="text" placeholder="e.g. Red" className="w-full mt-2 rounded-none border border-[#B6925B]/20 bg-white px-2 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">SKU</label>
                        <input value={v.sku || ""} onChange={e => dispatchVariants({ type: "UPDATE", index, field: "sku", value: e.target.value })} type="text" placeholder="SKU-123" className="w-full mt-2 rounded-none border border-[#B6925B]/20 bg-white px-2 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Stock</label>
                        <input value={v.stockQuantity} onChange={e => dispatchVariants({ type: "UPDATE", index, field: "stockQuantity", value: e.target.value })} type="number" className="w-full mt-2 rounded-none border border-[#B6925B]/20 bg-white px-2 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Price Offset (₹)</label>
                        <input value={v.priceOffset} onChange={e => dispatchVariants({ type: "UPDATE", index, field: "priceOffset", value: e.target.value })} type="number" step="0.01" className="w-full mt-2 rounded-none border border-[#B6925B]/20 bg-white px-2 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
                      </div>
                      <div className="col-span-1 flex justify-end mt-6">
                        <button type="button" onClick={() => dispatchVariants({ type: "REMOVE", index })} className="text-gray-400 hover:text-red-700 p-1 transition-colors flex items-center justify-center">
                          <i className="ri-close-line text-base" />
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