"use client";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProduct } from "@/actions/admin";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({ id, name }: { id: string, name: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProduct(id);
      router.refresh();
    } catch (error) {
      alert("Failed to delete product");
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-gray-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
      title="Delete Product"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
