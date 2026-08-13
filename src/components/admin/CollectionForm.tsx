"use client";
import { useState } from "react";
import { createCollection, updateCollection } from "@/actions/admin";
import ImageUpload from "./ImageUpload";
import Image from "next/image";
import AdminForm from "./AdminForm";
import type { Collection } from "@/generated/prisma";

export default function CollectionForm({ initialData }: { initialData?: Collection }) {
  const [image, setImage] = useState<string>(initialData?.image || "");
  const [slug, setSlug] = useState<string>(initialData?.slug || "");
  const [slugTouched, setSlugTouched] = useState(false);

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

  return (
    <AdminForm
      initialData={initialData}
      createAction={createCollection}
      updateAction={updateCollection}
      onSuccessRedirect="/admin/collections"
      successMessage={initialData ? "Collection updated!" : "Collection created!"}
      errorMessage="Failed to save collection. Please try again."
    >
      {() => (
        <>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Collection Banner Image</label>
              <div className="flex flex-wrap gap-4 items-center">
                {image ? (
                  <div className="relative w-64 h-32 border border-[#B6925B]/20 flex-shrink-0 rounded-none">
                    <Image fill src={image} alt="Collection Banner" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 hover:bg-red-600 shadow-sm transition-colors flex items-center justify-center rounded-none"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  </div>
                ) : (
                  <div className="w-64 h-32 border border-[#B6925B]/20 overflow-hidden rounded-none">
                    <ImageUpload value="" onChange={(url) => { if (url) setImage(url) }} />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-2">Recommended size: 1200x400px (16:9 ratio approx)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Collection Name</label>
                <input required defaultValue={initialData?.name} name="name" type="text" onChange={handleNameChange} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="e.g. Winter Collection" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Slug (auto-generated)</label>
                <input name="slug" type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" placeholder="auto-generated from name" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Description (Optional)</label>
              <textarea defaultValue={initialData?.description ?? ""} name="description" rows={3} className="w-full rounded-none border border-[#B6925B]/20 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B]" />
            </div>
          </div>

          <input type="hidden" name="image" value={image} />
        </>
      )}
    </AdminForm>
  );
}