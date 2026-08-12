"use client";
import { useState } from "react";
import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface DeleteButtonProps {
  id: string;
  entityName: string;
  deleteAction: (id: string) => Promise<void>;
  confirmMessage?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function DeleteButton({ 
  id, 
  entityName, 
  deleteAction, 
  confirmMessage,
  onSuccess,
  className = ""
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

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-gray-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50 ${className}`}
      title={`Delete ${entityName}`}
    >
      {isDeleting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
    </button>
  );
}