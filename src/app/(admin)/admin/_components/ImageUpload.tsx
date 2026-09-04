"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const toast = useToast();

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadImage(formData);
      onChange(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  if (value) {
    return (
      <div className="relative w-full h-full min-h-[112px] rounded-none overflow-hidden group border border-[#B6925B]/20">
        <Image fill src={value} alt="Upload" className="object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1.5 bg-red-500 text-white rounded-none hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-none">
      <label 
        className={`flex flex-col items-center justify-center w-full h-full min-h-[112px] border-2 border-dashed rounded-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transition-colors'} ${
          isDragging ? "border-[#B6925B] bg-[#B6925B]/5" : "border-[#B6925B]/30 bg-[#FAFAFA] hover:bg-white"
        }`}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
      >
        <div className="flex flex-col items-center justify-center p-2 text-center">
          {isUploading ? (
            <Loader2 className="w-5 h-5 mb-1.5 text-[#B6925B] animate-spin" />
          ) : (
            <UploadCloud className={`w-5 h-5 mb-1.5 ${isDragging ? "text-[#B6925B]" : "text-gray-400"}`} />
          )}
          <p className="mb-0.5 text-[10px] leading-tight text-gray-500">
            {isUploading ? "Uploading..." : (
              <><span className="font-semibold text-[#B6925B]">Click or drag</span><br /> to upload</>
            )}
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled || isUploading}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
