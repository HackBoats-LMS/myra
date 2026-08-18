"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function ShareProductButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors"
    >
      <i className={copied ? "ri-check-line text-sm" : "ri-share-forward-line text-sm"} />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}