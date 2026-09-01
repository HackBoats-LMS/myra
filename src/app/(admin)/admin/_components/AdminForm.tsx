"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

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
      className="space-y-8 max-w-2xl bg-white p-8 border border-[#B6925B]/20 shadow-sm rounded-none"
    >
      {children({ isSubmitting, handleSubmit })}
      
      <div className="flex justify-end pt-6 border-t border-[#B6925B]/20 gap-4">
        <button 
          type="button" 
          onClick={() => router.back()}
          className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A3B2C] border border-[#B6925B]/20 transition-colors bg-white hover:bg-[#FAFAFA] rounded-none"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center disabled:opacity-50 rounded-none"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData?.id ? "Save Changes" : "Create"}
        </button>
      </div>
    </form>
  );
}
