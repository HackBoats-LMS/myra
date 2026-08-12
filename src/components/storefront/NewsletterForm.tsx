"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function NewsletterForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success("Thank you! You have successfully subscribed to our newsletter.");
      setEmail("");
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <div className="relative flex-1">
        <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-base leading-none" />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-none px-10 py-3 text-sm focus:outline-none focus:border-white focus:bg-white/20 transition-all text-white placeholder-white/60"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-white hover:bg-[#FAFAFA] text-[#4A3B2C] px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading && <i className="ri-loader-4-line animate-spin text-base" />}
        <span>Subscribe</span>
      </button>
    </form>
  );
}
