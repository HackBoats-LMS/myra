"use client";
import { useState } from "react";
import { subscribeNewsletter } from "@/actions/storefront/contact";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await subscribeNewsletter(formData);
      setStatus("success");
      setMessage("Thanks for subscribing!");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="Your email address"
        className="px-3 py-2 text-xs text-[#4A3B2C] bg-white rounded-none focus:outline-none w-56"
      />
      <button
        type="submit"
        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[#4A3B2C] text-white hover:opacity-90 transition-opacity rounded-none"
      >
        Subscribe
      </button>
      {status !== "idle" && (
        <span className={`text-[10px] font-bold uppercase tracking-widest ${status === "success" ? "text-green-200" : "text-red-200"}`}>
          {message}
        </span>
      )}
    </form>
  );
}