"use client";
import { useState } from "react";
import { createCollection, updateCollection } from "@/actions/admin";
import AdminForm from "@/app/(admin)/admin/_components/AdminForm";
import ImageUpload from "@/app/(admin)/admin/_components/ImageUpload";
import Image from "next/image";
import type { Prisma } from "@/generated/prisma";
import { X } from "lucide-react";

interface CollectionFormProps {
  initialData?: Prisma.CollectionGetPayload<{ select: { id: true; name: true; slug: true; description: true; image: true; banners: true; parentId: true; order: true; showInNav: true } }>;
  parentCollections?: { id: string; name: string }[];
  defaultParentId?: string;
}

export default function CollectionForm({ 
  initialData, 
  parentCollections = [], 
  defaultParentId 
}: CollectionFormProps) {
  const [slug, setSlug] = useState<string>(initialData?.slug || "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [thumbnailImage, setThumbnailImage] = useState<string>(initialData?.image || "");
  const [banners, setBanners] = useState<string[]>(initialData?.banners || []);
  const [showInNav, setShowInNav] = useState<boolean>(initialData?.showInNav ?? true);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugTouched) {
      setSlug(
        e.target.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleAddBanner = (url: string) => {
    if (url && banners.length < 5) {
      setBanners(prev => [...prev, url]);
    }
  };

  const handleRemoveBanner = (index: number) => {
    setBanners(prev => prev.filter((_, i) => i !== index));
  };

  const currentParentId = initialData?.parentId || defaultParentId || "";

  return (
    <AdminForm
      initialData={initialData}
      createAction={createCollection}
      updateAction={updateCollection}
      onSuccessRedirect="/admin/collections"
      successMessage={initialData ? "Category updated!" : "Category created!"}
      errorMessage="Failed to save category. Please try again."
    >
      {() => (
        <>
          <div className="space-y-8">
            {/* 1. Name & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Category Name</label>
                <input required defaultValue={initialData?.name} name="name" type="text" onChange={handleNameChange} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="e.g. Sarees or Silk Sarees" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Slug (auto-generated)</label>
                <input name="slug" type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="auto-generated from name" />
              </div>
            </div>

            {/* 2. Parent Category & Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">
                  Parent Category (Optional)
                </label>
                <select 
                  name="parentId" 
                  defaultValue={currentParentId}
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]"
                >
                  <option value="">None (Top-Level Category)</option>
                  {parentCollections
                    .filter(c => !initialData || c.id !== initialData.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  Leave empty to create a Main Category (like Sarees, Women, Kids), or select a parent to create a Subcategory.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">
                  Display Order
                </label>
                <input 
                  defaultValue={initialData?.order ?? 0} 
                  name="order" 
                  type="number" 
                  className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" 
                  placeholder="0" 
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Lower numbers appear first in the navbar navigation.
                </p>
              </div>
            </div>

            {/* 3. Include in Navbar Option */}
            <div className="bg-[#FDFBF7] p-4 border border-[#B6925B]/20 flex items-center justify-between">
              <div>
                <label htmlFor="showInNav" className="block text-xs font-bold uppercase tracking-widest text-[#4A3B2C] cursor-pointer">
                  Include in Navbar & Navigation Menu
                </label>
                <p className="text-[11px] text-gray-500 mt-1">
                  When enabled, this category or subcategory will be displayed in the storefront top navigation bar, header dropdowns, and mobile menu drawer.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input 
                  type="checkbox" 
                  id="showInNav"
                  checked={showInNav} 
                  onChange={(e) => setShowInNav(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B6925B]"></div>
              </label>
              <input type="hidden" name="showInNav" value={String(showInNav)} />
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Description (Optional)</label>
              <textarea defaultValue={initialData?.description ?? ""} name="description" rows={3} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="Short description of this category..." />
            </div>

            {/* 4. Category Thumbnail / Card Image */}
            <div className="pt-4 border-t border-[#B6925B]/20">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                Category Card / Thumbnail Image (Optional)
              </label>
              <p className="text-[11px] text-gray-500 mb-3">
                Used for the visual card preview when subcategories are displayed on the parent category page.
              </p>

              {thumbnailImage ? (
                <div className="relative w-40 h-52 rounded-none overflow-hidden border border-[#B6925B]/30 shadow-sm group">
                  <Image 
                    fill 
                    src={thumbnailImage} 
                    alt="Category Card Thumbnail" 
                    className="object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailImage("")}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 shadow-md hover:bg-red-700 transition-colors flex items-center justify-center cursor-pointer"
                    title="Remove Thumbnail"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-52 border border-dashed border-[#B6925B]/40 bg-[#FAFAFA] flex items-center justify-center p-2">
                  <ImageUpload 
                    value="" 
                    onChange={(url) => { if (url) setThumbnailImage(url); }} 
                  />
                </div>
              )}
            </div>

            {/* 5. Custom Promotional Banners */}
            <div className="pt-4 border-t border-[#B6925B]/20">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">
                    Category Landing Page Custom Banners ({banners.length}/5)
                  </label>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Upload custom hero / promotional banners for this category page.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center mt-3">
                {banners.map((url, index) => (
                  <div key={index} className="relative w-64 h-36 rounded-none overflow-hidden border border-[#B6925B]/30 shadow-sm group">
                    <Image 
                      fill 
                      src={url} 
                      alt={`Banner ${index + 1}`} 
                      className="object-cover" 
                    />
                    <div className="absolute top-1 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 font-mono">
                      Banner #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBanner(index)}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 hover:bg-red-700 shadow-md transition-colors flex items-center justify-center cursor-pointer"
                      title="Remove Banner"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {banners.length < 5 && (
                  <div className="w-64 h-36 border border-dashed border-[#B6925B]/40 bg-[#FAFAFA] flex items-center justify-center p-3">
                    <ImageUpload 
                      value="" 
                      onChange={handleAddBanner} 
                    />
                  </div>
                )}
              </div>
            </div>

            <input type="hidden" name="image" value={thumbnailImage} />
            <input type="hidden" name="banners" value={JSON.stringify(banners)} />
          </div>
        </>
      )}
    </AdminForm>
  );
}


