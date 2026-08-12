"use client";
import { useState } from "react";
import { createCollection, updateCollection } from "@/actions/admin";
import ImageUpload from "./ImageUpload";
import Image from "next/image";
import AdminForm from "./AdminForm";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Collection } from "@/generated/prisma";

export default function CollectionForm({ initialData }: { initialData?: Collection }) {
  const [image, setImage] = useState<string>(initialData?.image || "");

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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Collection Banner Image</label>
              <div className="flex flex-wrap gap-4 items-center">
                {image ? (
                  <div className="relative w-64 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                    <Image fill src={image} alt="Collection Banner" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm transition-colors"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-64 h-32 border border-gray-200 rounded-lg overflow-hidden">
                    <ImageUpload value="" onChange={(url) => { if (url) setImage(url) }} />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Recommended size: 1200x400px (16:9 ratio approx)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
                <input required defaultValue={initialData?.name} name="name" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" placeholder="e.g. Winter Collection" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL friendly)</label>
                <input required defaultValue={initialData?.slug} name="slug" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" placeholder="e.g. winter-collection" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea defaultValue={initialData?.description ?? ""} name="description" rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
            </div>
          </div>

          <input type="hidden" name="image" value={image} />
        </>
      )}
    </AdminForm>
  );
}