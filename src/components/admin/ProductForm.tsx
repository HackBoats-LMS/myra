"use client"
import { useState } from "react";
import { createProduct, updateProduct } from "@/actions/admin";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  collections: any[];
  initialData?: any;
}

export default function ProductForm({ collections, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.images?.[0] || "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("image", imageUrl);

    try {
      if (initialData) {
        await updateProduct(initialData.id, formData);
      } else {
        await createProduct(formData);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      alert("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input required defaultValue={initialData?.price} name="price" type="number" step="0.01" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
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
          {initialData ? "Save Changes" : "Create Product"}
        </button>
      </div>

    </form>
  );
}
