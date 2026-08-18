"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function PushNotificationSender() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [busy, setBusy] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send.");
      } else {
        toast.success(`Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"}.`);
        setTitle("");
        setBody("");
      }
    } catch {
      toast.error("Failed to send.");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] text-[#4A3B2C]";
  const label = "block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1";

  return (
    <form onSubmit={handleSend} className="bg-white border border-[#B6925B]/20 p-6 space-y-4 shadow-sm">
      <div>
        <label className={label}>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="New arrivals are here!" />
      </div>
      <div>
        <label className={label}>Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} className={field} placeholder="Optional body text" />
      </div>
      <div>
        <label className={label}>Open Link</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className={field} />
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 rounded-none"
        >
          {busy ? "Sending..." : "Broadcast Push Notification"}
        </button>
      </div>
    </form>
  );
}