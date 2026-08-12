"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";

interface AdminFormProps<T> {
  initialData?: T | null;
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (id: string, formData: FormData) => Promise<void>;
  onSuccessRedirect: string;
  successMessage: string;
  errorMessage?: string;
  children: (formState: {
    isSubmitting: boolean;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  }) => React.ReactNode;
}

export default function AdminForm<T extends { id?: string }>({
  initialData,
  createAction,
  updateAction,
  onSuccessRedirect,
  successMessage,
  errorMessage = "Failed to save. Please try again.",
  children
}: AdminFormProps<T>) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      if (initialData?.id) {
        await updateAction(initialData.id, formData);
      } else {
        await createAction(formData);
      }
      toast.success(successMessage);
      router.push(onSuccessRedirect);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-8 max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-200"
    >
      {children({ isSubmitting, handleSubmit })}
      
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
          {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
          {initialData?.id ? "Save Changes" : "Create"}
        </button>
      </div>
    </form>
  );
}