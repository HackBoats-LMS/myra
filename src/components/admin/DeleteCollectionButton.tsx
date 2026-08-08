"use client";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCollection } from "@/actions/admin";
import { useRouter } from "next/navigation";

export default function DeleteCollectionButton({ id, name }: { id: string, name: string }) {
  const router = useRouter();
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
      alert("Failed to delete collection");
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
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
