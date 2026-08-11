"use client";
import { useState } from "react";
import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { deleteCollection } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function DeleteCollectionButton({ id, name }: { id: string, name: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${name}? This will NOT delete the products inside it, but will remove them from the collection.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCollection(id);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete collection. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-gray-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
      title="Delete Collection"
    >
      {isDeleting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
    </button>
  );
}
