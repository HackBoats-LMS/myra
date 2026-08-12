"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

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
        <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded px-10 py-3 text-sm focus:outline-none focus:border-white focus:bg-white/20 transition-all text-white placeholder-white/60"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-white hover:bg-gray-100 text-[#0D3B66] px-6 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {loading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
        <span>Subscribe</span>
      </button>
    </form>
  );
}
