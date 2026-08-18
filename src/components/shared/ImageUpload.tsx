"use client";
import { useState } from "react";
import Image from "next/image";
import { uploadImage } from "@/actions/admin/admin";
import { useToast } from "@/components/ui/Toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 5;

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];

      // Client-side validation (server also validates)
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.");
        e.target.value = "";
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Image must be smaller than ${MAX_SIZE_MB} MB.`);
        e.target.value = "";
        return;
      }

      // Warn when the source is low-resolution (may look soft after upscaling).
      await warnIfLowResolution(file, toast);

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const publicUrl = await uploadImage(formData);
      onChange(publicUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error uploading image. Please try again.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative w-40 h-40 rounded-none overflow-hidden border border-[#B6925B]/20">
        <Image fill src={value} alt="Upload" className="object-cover" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-none hover:bg-red-600 shadow-sm transition-colors flex items-center justify-center"
        >
          <i className="ri-close-line text-sm" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-none">
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[#B6925B]/30 border-dashed rounded-none cursor-pointer bg-[#FAFAFA] hover:bg-white transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <i className="ri-loader-4-line text-2xl text-gray-400 animate-spin mb-3" />
          ) : (
            <i className="ri-upload-cloud-line text-2xl text-gray-400 mb-3" />
          )}
          <p className="mb-1 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> product image
          </p>
          <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF · Max {MAX_SIZE_MB} MB</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}

async function warnIfLowResolution(file: File, toast: { error: (m: string) => void }) {
  try {
    const bitmap = await createImageBitmap(file);
    const shortSide = Math.min(bitmap.width, bitmap.height);
    bitmap.close();
    if (shortSide > 0 && shortSide < 600) {
      toast.error("This image is low-resolution. It will be upscaled and sharpened, but a higher-resolution photo will look better.");
    }
  } catch {
    // Could not read dimensions (e.g. GIF); skip the warning.
  }
}
