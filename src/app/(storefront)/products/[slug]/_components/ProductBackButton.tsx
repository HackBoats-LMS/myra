"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ProductBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/collections");
        }
      }}
      className="p-1 text-black hover:text-[#B6925B] transition-colors mb-4 inline-flex items-center group cursor-pointer"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
    </button>
  );
}
