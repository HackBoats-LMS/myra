"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface DeleteButtonProps {
  id: string;
  entityName: string;
  deleteAction: (id: string) => Promise<void>;
  confirmMessage?: string;
  onSuccess?: () => void;
  className?: string;
  label?: string;
}

export default function DeleteButton({ 
  id, 
  entityName, 
  deleteAction, 
  confirmMessage,
  onSuccess,
  className = "",
  label
}: DeleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultConfirmMessage = `Are you sure you want to delete ${entityName}? This action cannot be undone.`;

  const handleDelete = async () => {
    if (!confirm(confirmMessage || defaultConfirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAction(id);
      toast.success(`${entityName} deleted successfully.`);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch {
      toast.error(`Failed to delete ${entityName.toLowerCase()}. Please try again.`);
      setIsDeleting(false);
    }
  };

  const defaultIcon = !className && !label ? "text-gray-400 hover:text-red-600 p-1" : "";
  const labelClass = label ? "gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800" : "";

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className={`transition-colors disabled:opacity-50 flex items-center justify-center ${defaultIcon} ${labelClass} ${className}`}
      title={`Delete ${entityName}`}
    >
      {isDeleting ? <i className="ri-loader-4-line animate-spin text-lg" /> : <i className="ri-delete-bin-line text-lg" />}
      {label && <span>{label}</span>}
    </button>
  );
}