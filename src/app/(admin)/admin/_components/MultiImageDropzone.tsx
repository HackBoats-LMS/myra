"use client";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { UploadCloud } from "lucide-react";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles: number;
}

export default function ImageUpload({ onFilesSelected, maxFiles }: ImageUploadProps) {
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    
    const validFiles = files.filter(file => {
      const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".mov") || file.name.endsWith(".webm");
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported media type.`);
        return false;
      }
      const maxMb = isVideo ? 50 : 10;
      if (file.size > maxMb * 1024 * 1024) {
        toast.error(`${file.name} must be smaller than ${maxMb} MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles.slice(0, maxFiles));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [maxFiles]);

  return (
    <div className="w-full h-full rounded-none">
      <label 
        className={`flex flex-col items-center justify-center w-full h-full min-h-[112px] border-2 border-dashed rounded-none cursor-pointer transition-colors ${
          isDragging ? "border-[#7A0B2E] bg-[#7A0B2E]/5" : "border-[#7A0B2E]/30 bg-[#FAFAFA] hover:bg-white"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <UploadCloud className={`w-5 h-5 mb-1.5 ${isDragging ? "text-[#7A0B2E]" : "text-gray-400"}`} />
          <p className="mb-0.5 text-[10px] leading-tight text-gray-500">
            <span className="font-semibold text-[#7A0B2E]">Click or drag</span>
            <br /> to add media
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
