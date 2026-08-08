"use client"
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

import { uploadImage } from "@/actions/admin";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      setIsUploading(true);
      const file = e.target.files[0];
      
      const formData = new FormData();
      formData.append("file", file);

      const publicUrl = await uploadImage(formData);
      onChange(publicUrl);
    } catch (error: any) {
      alert(error.message || "Error uploading image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200">
        <Image fill src={value} alt="Upload" className="object-cover" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-sm transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-3" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 mb-3" />
          )}
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> product image
          </p>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
      </label>
    </div>
  );
}
