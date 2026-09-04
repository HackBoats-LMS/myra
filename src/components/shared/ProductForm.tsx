"use client";
import { useState, useReducer } from "react";
import { createProduct, updateProduct } from "@/actions/admin";
import MultiImageDropzone from "@/app/(admin)/admin/_components/MultiImageDropzone";
import Image from "next/image";
import AdminForm from "@/app/(admin)/admin/_components/AdminForm";
import type { Prisma } from "@/generated/prisma";
import { ChevronLeft, ChevronRight, X, Plus, Layers, Palette } from "lucide-react";

interface ProductVariant {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  stockQuantity: number;
  priceOffset: number;
}

type CollectionWithHierarchy = Prisma.CollectionGetPayload<{
  include: { parent?: true; children?: true };
}>;

interface ProductFormProps {
  collections: CollectionWithHierarchy[];
  initialData?: Prisma.ProductGetPayload<{ include: { variants: true } }>;
}

type ImageState = 
  | { id: string; type: "existing"; url: string }
  | { id: string; type: "new"; file: File; previewUrl: string };

type ImagesAction =
  | { type: "ADD_NEW"; files: File[] }
  | { type: "REMOVE"; index: number }
  | { type: "MOVE"; from: number; to: number };

function imagesReducer(state: ImageState[], action: ImagesAction): ImageState[] {
  switch (action.type) {
    case "ADD_NEW": {
      const newImages = action.files.map(f => ({
        id: crypto.randomUUID(),
        type: "new" as const,
        file: f,
        previewUrl: URL.createObjectURL(f)
      }));
      return [...state, ...newImages];
    }
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
  | { type: "ADD"; variant?: Partial<ProductVariant> }
  | { type: "UPDATE"; index: number; field: string; value: string | number }
  | { type: "REMOVE"; index: number }
  | { type: "SET"; variants: ProductVariant[] };

const emptyVariant = (defaults?: Partial<ProductVariant>): ProductVariant => ({
  id: defaults?.id || "",
  sku: defaults?.sku || "",
  size: defaults?.size || "",
  color: defaults?.color || "",
  stockQuantity: defaults?.stockQuantity ?? 10,
  priceOffset: defaults?.priceOffset ?? 0,
});

function variantsReducer(state: ProductVariant[], action: VariantsAction): ProductVariant[] {
  switch (action.type) {
    case "ADD":
      return [...state, emptyVariant(action.variant)];
    case "UPDATE":
      return state.map((v, i) =>
        i === action.index ? { ...v, [action.field]: action.value } : v
      );
    case "REMOVE":
      return state.filter((_, i) => i !== action.index);
    case "SET":
      return action.variants;
    default:
      return state;
  }
}

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const COMMON_COLORS = ["Red", "Maroon", "Royal Blue", "Navy", "Emerald Green", "Pink", "Mustard Yellow", "Orange", "Black", "Gold"];

export default function ProductForm({ collections, initialData }: ProductFormProps) {
  const [images, dispatchImages] = useReducer(
    imagesReducer, 
    (initialData?.images || []).map(url => ({ id: crypto.randomUUID(), type: "existing", url }))
  );
  const [variants, dispatchVariants] = useReducer(variantsReducer, initialData?.variants || []);
  
  // Track whether size or color options are enabled
  const hasExistingSizes = initialData?.variants && initialData.variants.some(v => Boolean(v.size));
  const hasExistingColors = initialData?.variants && initialData.variants.some(v => Boolean(v.color));

  const [hasSizes, setHasSizes] = useState<boolean>(Boolean(hasExistingSizes));
  const [hasColors, setHasColors] = useState<boolean>(Boolean(hasExistingColors));
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customColorInput, setCustomColorInput] = useState("");
  const [baseStock, setBaseStock] = useState<number>(initialData?.stockQuantity ?? 0);

  // Dynamic Attributes State
  const [productType, setProductType] = useState(initialData?.productType || "");
  const [attributes, setAttributes] = useState<Array<{key: string, value: string}>>(() => {
    let initialAttrs: Record<string, string> = {};
    if (initialData?.attributes && typeof initialData.attributes === 'object' && !Array.isArray(initialData.attributes)) {
      initialAttrs = initialData.attributes as Record<string, string>;
    }
    // Migrate old fields
    if (initialData?.material && !initialAttrs["Material / Fabric"]) initialAttrs["Material / Fabric"] = initialData.material;
    if (initialData?.weight && !initialAttrs["Weight"]) initialAttrs["Weight"] = initialData.weight;
    
    return Object.entries(initialAttrs).map(([k, v]) => ({ key: k, value: v }));
  });

  const TEMPLATES: Record<string, string[]> = {
    "Saree": ["Material / Fabric", "Pattern", "Blouse Piece", "Wash Care"],
    "Suit": ["Material / Fabric", "Pattern", "Bottom Wear", "Dupatta", "Wash Care"],
    "Lehenga": ["Material / Fabric", "Pattern", "Blouse / Choli", "Dupatta", "Wash Care"],
    "Anarkali Suit": ["Material / Fabric", "Pattern", "Bottom Wear", "Dupatta", "Wash Care"],
    "Kurti / Ethnic": ["Material / Fabric", "Pattern", "Wash Care"],
    "Dress": ["Material / Fabric", "Pattern", "Wash Care"],
  };

  const handleProductTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setProductType(type);
    
    if (TEMPLATES[type]) {
      // Merge new template keys with existing attributes, avoiding duplicates
      setAttributes(prev => {
        const currentKeys = new Set(prev.map(a => a.key));
        const newAttrs = [...prev];
        TEMPLATES[type].forEach(k => {
          if (!currentKeys.has(k)) {
            newAttrs.push({ key: k, value: "" });
          }
        });
        return newAttrs;
      });
    }
  };

  // Group collections into Top-level Categories and Subcategories
  const topLevelCategories = collections.filter(c => !c.parentId);
  const orphanSubcategories = collections.filter(c => c.parentId && !topLevelCategories.some(p => p.id === c.parentId));

  // Compute total stock from variants if variants exist, otherwise baseStock
  const totalStock = (hasSizes || hasColors) && variants.length > 0
    ? variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0)
    : baseStock;

  const handleAddSizeQuick = (size: string) => {
    // Check if variant with this size already exists
    if (!variants.some(v => v.size === size && (!hasColors || !v.color))) {
      dispatchVariants({
        type: "ADD",
        variant: { size, stockQuantity: 10 }
      });
    }
  };

  const handleAddColorQuick = (color: string) => {
    if (!variants.some(v => v.color === color && (!hasSizes || !v.size))) {
      dispatchVariants({
        type: "ADD",
        variant: { color, stockQuantity: 10 }
      });
    }
  };

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(initialData?.videoUrl || "");
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const wrappedCreateAction = async (formData: FormData) => {
    setIsUploadingFiles(true);
    try {
      const finalUrls = [];
      for (const img of images) {
        if (img.type === "existing") {
          finalUrls.push(img.url);
        } else {
          const uploadData = new FormData();
          uploadData.append("file", img.file);
          const { uploadMedia } = await import("@/actions/admin");
          const publicUrl = await uploadMedia(uploadData);
          finalUrls.push(publicUrl);
        }
      }
      formData.set("images", JSON.stringify(finalUrls));

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        const uploadData = new FormData();
        uploadData.append("file", videoFile);
        const { uploadMedia } = await import("@/actions/admin");
        finalVideoUrl = await uploadMedia(uploadData);
      }
      formData.set("videoUrl", finalVideoUrl);

      await createProduct(formData);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const wrappedUpdateAction = async (id: string, formData: FormData) => {
    setIsUploadingFiles(true);
    try {
      const finalUrls = [];
      for (const img of images) {
        if (img.type === "existing") {
          finalUrls.push(img.url);
        } else {
          const uploadData = new FormData();
          uploadData.append("file", img.file);
          const { uploadMedia } = await import("@/actions/admin");
          const publicUrl = await uploadMedia(uploadData);
          finalUrls.push(publicUrl);
        }
      }
      formData.set("images", JSON.stringify(finalUrls));

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        const uploadData = new FormData();
        uploadData.append("file", videoFile);
        const { uploadMedia } = await import("@/actions/admin");
        finalVideoUrl = await uploadMedia(uploadData);
      }
      formData.set("videoUrl", finalVideoUrl);

      await updateProduct(id, formData);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  return (
    <AdminForm
      initialData={initialData}
      createAction={wrappedCreateAction}
      updateAction={wrappedUpdateAction}
      onSuccessRedirect="/admin/products"
      successMessage={initialData ? "Product updated!" : "Product created!"}
      errorMessage="Failed to save product. Please try again."
    >
      {() => (
        <>
          <div className="space-y-6">
            {/* 1. Images */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">
                Product Images ({images.length}/5)
              </label>
              <div className="flex flex-wrap gap-4 items-center">
                {images.map((img, index) => (
                  <div key={img.id} className="relative w-28 h-28 rounded-none overflow-hidden border border-[#B6925B]/20 shadow-sm flex-shrink-0 group">
                    <Image fill src={img.type === "new" ? img.previewUrl : img.url} alt={`Preview ${index + 1}`} className="object-cover" />

                    {/* Reorder Buttons (Hover) */}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent pt-4">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => dispatchImages({ type: "MOVE", from: index, to: index - 1 })}
                        className="text-white disabled:opacity-30 hover:text-[#B6925B] p-1 rounded flex items-center justify-center cursor-pointer"
                        aria-label="Move image left"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => dispatchImages({ type: "MOVE", from: index, to: index + 1 })}
                        className="text-white disabled:opacity-30 hover:text-[#B6925B] p-1 rounded flex items-center justify-center cursor-pointer"
                        aria-label="Move image right"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => dispatchImages({ type: "REMOVE", index })}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 hover:bg-red-600 shadow-sm transition-colors flex items-center justify-center rounded-none cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <div className="w-28 h-28 border border-[#B6925B]/20 rounded-none overflow-hidden">
                    <MultiImageDropzone 
                      maxFiles={5 - images.length} 
                      onFilesSelected={(files) => dispatchImages({ type: "ADD_NEW", files })} 
                    />
                  </div>
                )}
              </div>
              {images.length >= 5 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-2">Maximum limit of 5 images reached.</p>
              )}
            </div>

            {/* 2. Product Name & Code */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Product Name</label>
              <input 
                required 
                defaultValue={initialData?.name} 
                name="name" 
                type="text" 
                className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" 
                placeholder="e.g. Bright Orange Gotta Patti & Mirror Work Anarkali Suit Set"
              />
              {initialData?.code && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mt-1">Product Code: {initialData.code}</p>
              )}
            </div>

            {/* 3. Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Description</label>
              <textarea 
                required 
                defaultValue={initialData?.description} 
                name="description" 
                rows={4} 
                className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" 
                placeholder="Describe fabric, embellishments, fitting, occasion, etc."
              />
            </div>

            {/* 4. Pricing & Category Hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Base Price (Original ₹)</label>
                <input 
                  defaultValue={initialData?.originalPrice ?? ""} 
                  name="originalPrice" 
                  type="number" 
                  step="0.01" 
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" 
                  placeholder="e.g. 1999" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Selling Price (₹)</label>
                <input 
                  required 
                  defaultValue={initialData?.price} 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" 
                  placeholder="e.g. 1499" 
                />
              </div>

              {/* Grouped Category & Subcategory Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">
                  Category / Subcategory
                </label>
                <select 
                  name="collectionId" 
                  defaultValue={initialData?.collectionId || ""} 
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
                >
                  <option value="">Select category / subcategory</option>
                  {topLevelCategories.map(parent => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (Main Category)</option>
                      {parent.children?.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>
                          &nbsp;&nbsp;↳ {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {orphanSubcategories.length > 0 && (
                    <optgroup label="Other Subcategories">
                      {orphanSubcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* 5. Product Attributes */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-[#4A3B2C] uppercase tracking-widest flex items-center gap-2">
                  Product Details & Attributes
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Product Type</label>
                  <select 
                    name="productType" 
                    value={productType}
                    onChange={handleProductTypeChange}
                    className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
                  >
                    <option value="">Select type</option>
                    {["Saree", "Anarkali Suit", "Suit", "Kurti / Ethnic", "Dress", "Lehenga", "Top", "Bottom", "Kids Wear", "Gown"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Attributes Builder */}
              <div className="space-y-2 border border-[#B6925B]/20 p-4 bg-[#FAFAFA]">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Specifications / Details</label>
                {attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Attribute (e.g. Fabric)"
                      value={attr.key}
                      onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[index].key = e.target.value;
                        setAttributes(newAttrs);
                      }}
                      className="flex-1 rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Silk)"
                      value={attr.value}
                      onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[index].value = e.target.value;
                        setAttributes(newAttrs);
                      }}
                      className="flex-[2] rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
                    />
                    <button
                      type="button"
                      onClick={() => setAttributes(attributes.filter((_, i) => i !== index))}
                      className="p-2 text-red-500 hover:bg-red-50 border border-transparent transition-colors"
                      title="Remove Attribute"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setAttributes([...attributes, { key: "", value: "" }])}
                  className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Custom Detail
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Product Video (optional)</label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <p className="text-[10px] text-gray-500 mb-1">Direct URL</p>
                  <input 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    type="url" 
                    placeholder="https://... (or upload file below)" 
                    className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" 
                    disabled={!!videoFile}
                  />
                </div>
                
                <span className="text-[10px] text-gray-400 font-bold uppercase">OR</span>
                
                <div className="flex-1 w-full">
                  <p className="text-[10px] text-gray-500 mb-1">Upload MP4 (Max 50MB)</p>
                  <input 
                    type="file" 
                    accept="video/mp4" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setVideoFile(e.target.files[0]);
                        setVideoUrl(""); // clear URL if file uploaded
                      } else {
                        setVideoFile(null);
                      }
                    }}
                    className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-1.5 text-sm text-[#4A3B2C] file:mr-4 file:py-1 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-[#B6925B]/10 file:text-[#B6925B] hover:file:bg-[#B6925B]/20 cursor-pointer"
                  />
                </div>
              </div>

              {videoUrl && !videoFile && (
                 <video src={videoUrl} controls className="mt-3 h-32 border border-[#B6925B]/20 bg-black" />
              )}
              {videoFile && (
                 <p className="text-[10px] text-green-600 mt-1 font-bold">Selected for upload: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
              )}
            </div>

            {/* Mark as Best Seller */}
            <div className="bg-[#FAFAFA] p-4 border border-[#B6925B]/20">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="bestSeller"
                  defaultChecked={initialData?.bestSeller ?? false}
                  value="true"
                  className="w-4 h-4 accent-[#B6925B] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider block">
                    Mark as Best Seller
                  </span>
                  <span className="text-[10px] text-gray-500 block">
                    Force this product to appear at the top of the Best Sellers list.
                  </span>
                </div>
              </label>
            </div>

            {/* 6. Variants & Stock Management Workflow */}
            <div className="pt-6 border-t border-[#B6925B]/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#4A3B2C] uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#B6925B]" />
                    Inventory & Options
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Enable size or color checkboxes if this product comes in multiple options with separate stock.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#FDFBF7] px-3 py-1.5 border border-[#B6925B]/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A3B2C]">Total Inventory:</span>
                  <span className="text-sm font-bold text-[#B6925B]">{totalStock} units</span>
                </div>
              </div>

              {/* Checkboxes: Need sizes & Need colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAFAFA] p-4 border border-[#B6925B]/20">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasSizes}
                    onChange={(e) => {
                      setHasSizes(e.target.checked);
                      if (e.target.checked && variants.length === 0) {
                        // Prepopulate default sizes S, M, L, XL
                        dispatchVariants({
                          type: "SET",
                          variants: [
                            emptyVariant({ size: "S", stockQuantity: 10 }),
                            emptyVariant({ size: "M", stockQuantity: 15 }),
                            emptyVariant({ size: "L", stockQuantity: 10 }),
                            emptyVariant({ size: "XL", stockQuantity: 5 }),
                          ]
                        });
                      }
                    }}
                    className="w-4 h-4 accent-[#B6925B] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider block">
                      This product needs sizes (e.g. S, M, L, XL)
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Add individual size options and specify quantities for each.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasColors}
                    onChange={(e) => {
                      setHasColors(e.target.checked);
                      if (e.target.checked && variants.length === 0) {
                        dispatchVariants({
                          type: "ADD",
                          variant: { color: "Red", stockQuantity: 10 }
                        });
                      }
                    }}
                    className="w-4 h-4 accent-[#B6925B] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider block flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#B6925B]" />
                      This product needs colors
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Specify color variants with individual quantities.
                    </span>
                  </div>
                </label>
              </div>

              {/* If Neither is checked: Single base stock */}
              {!hasSizes && !hasColors && (
                <div className="bg-white p-4 border border-[#B6925B]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                      Standard Product Stock Quantity
                    </label>
                    <p className="text-[11px] text-gray-500">
                      This product has no size/color variants. It will be sold as a single item with this stock.
                    </p>
                  </div>
                  <div className="w-40">
                    <input 
                      required 
                      value={baseStock} 
                      onChange={(e) => setBaseStock(parseInt(e.target.value, 10) || 0)} 
                      type="number" 
                      min="0"
                      className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] font-bold" 
                      placeholder="e.g. 50" 
                    />
                  </div>
                </div>
              )}

              {/* If Sizes or Colors is checked: Variant Builder */}
              {(hasSizes || hasColors) && (
                <div className="space-y-4">
                  {/* Quick Add Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {hasSizes && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A3B2C] mr-1">Quick Add Size:</span>
                        {COMMON_SIZES.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleAddSizeQuick(s)}
                            className="px-2 py-1 text-[10px] font-serif border border-[#B6925B]/40 hover:bg-[#B6925B] hover:text-white transition-colors bg-white cursor-pointer"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {hasColors && !hasSizes && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A3B2C] mr-1">Quick Add Color:</span>
                        {COMMON_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleAddColorQuick(c)}
                            className="px-2 py-1 text-[10px] font-sans border border-[#B6925B]/40 hover:bg-[#B6925B] hover:text-white transition-colors bg-white cursor-pointer"
                          >
                            + {c}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => dispatchVariants({ type: "ADD" })}
                      className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#B6925B] hover:bg-[#9c7d4e] px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Custom Row
                    </button>
                  </div>

                  {/* Variants Table / Rows */}
                  {variants.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-[#B6925B]/40 bg-[#FAFAFA]">
                      <p className="text-xs text-gray-500 font-medium">No options added yet. Click one of the quick size/color buttons above or click &ldquo;Add Custom Row&rdquo;.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {variants.map((v, index) => (
                        <div 
                          key={index} 
                          className="grid grid-cols-12 gap-3 items-center bg-[#FAFAFA] p-3 border border-[#B6925B]/20"
                        >
                          {/* Size Field (if sizes enabled) */}
                          <div className={hasColors ? "col-span-3 sm:col-span-2" : "col-span-4 sm:col-span-3"}>
                            <label className="block text-[9px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1">
                              Size
                            </label>
                            <input 
                              value={v.size || ""} 
                              onChange={e => dispatchVariants({ type: "UPDATE", index, field: "size", value: e.target.value })} 
                              type="text" 
                              placeholder="e.g. M" 
                              className="w-full rounded-none border border-[#B6925B]/20 bg-white px-2.5 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]" 
                            />
                          </div>

                          {/* Color Field (if colors enabled) */}
                          {hasColors && (
                            <div className={hasSizes ? "col-span-3 sm:col-span-2" : "col-span-4 sm:col-span-3"}>
                              <label className="block text-[9px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1">
                                Color
                              </label>
                              <input 
                                value={v.color || ""} 
                                onChange={e => dispatchVariants({ type: "UPDATE", index, field: "color", value: e.target.value })} 
                                type="text" 
                                placeholder="e.g. Royal Blue" 
                                className="w-full rounded-none border border-[#B6925B]/20 bg-white px-2.5 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]" 
                              />
                            </div>
                          )}

                          {/* Stock Quantity (Prominent) */}
                          <div className="col-span-3 sm:col-span-2">
                            <label className="block text-[9px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">
                              Qty / Stock
                            </label>
                            <input 
                              value={v.stockQuantity} 
                              onChange={e => dispatchVariants({ type: "UPDATE", index, field: "stockQuantity", value: parseInt(e.target.value, 10) || 0 })} 
                              type="number" 
                              min="0"
                              className="w-full rounded-none border border-[#B6925B]/40 bg-white px-2.5 py-1.5 text-xs text-[#4A3B2C] font-bold focus:outline-none focus:border-[#B6925B]" 
                            />
                          </div>

                          {/* SKU */}
                          <div className="col-span-3 sm:col-span-3 hidden sm:block">
                            <label className="block text-[9px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1">
                              SKU (optional)
                            </label>
                            <input 
                              value={v.sku || ""} 
                              onChange={e => dispatchVariants({ type: "UPDATE", index, field: "sku", value: e.target.value })} 
                              type="text" 
                              placeholder="e.g. SKU-M-BLU" 
                              className="w-full rounded-none border border-[#B6925B]/20 bg-white px-2.5 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]" 
                            />
                          </div>

                          {/* Price Offset */}
                          <div className="col-span-2 sm:col-span-2 hidden sm:block">
                            <label className="block text-[9px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1">
                              + Price (₹)
                            </label>
                            <input 
                              value={v.priceOffset} 
                              onChange={e => dispatchVariants({ type: "UPDATE", index, field: "priceOffset", value: parseFloat(e.target.value) || 0 })} 
                              type="number" 
                              step="0.01" 
                              placeholder="0"
                              className="w-full rounded-none border border-[#B6925B]/20 bg-white px-2.5 py-1.5 text-xs text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]" 
                            />
                          </div>

                          {/* Delete Row Button */}
                          <div className="col-span-1 flex justify-end">
                            <button 
                              type="button" 
                              onClick={() => dispatchVariants({ type: "REMOVE", index })} 
                              className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                              title="Remove option"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="stockQuantity" value={totalStock} />
          {/* We do NOT serialize images here anymore, the wrapper sets it! */}
          <input type="hidden" name="attributes" value={JSON.stringify(attributes)} />
          <input type="hidden" name="variants" value={JSON.stringify((hasSizes || hasColors) ? variants : [])} />
        </>
      )}
    </AdminForm>
  );
}
