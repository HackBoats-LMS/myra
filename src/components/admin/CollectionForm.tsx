"use client";
import { useState } from "react";
import { createCollection, updateCollection } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CollectionForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (initialData) {
        await updateCollection(initialData.id, formData);
      } else {
        await createCollection(formData);
      }
      router.push("/admin/collections");
      router.refresh();
    } catch (error) {
      alert("Failed to save collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      
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
        <textarea defaultValue={initialData?.description} name="description" rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button 
          type="button" 
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 mr-4"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#0D3B66] hover:bg-[#082a4d] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {initialData ? "Save Changes" : "Create Collection"}
        </button>
      </div>
    </form>
  );
}
