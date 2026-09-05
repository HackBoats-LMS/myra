"use client";
import { useState } from "react";
import Image from "next/image";
import { requestReturn, cancelReturnRequest, uploadReturnImage } from "@/actions/returns";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { ReturnRequest } from "@/generated/prisma";

interface OrderItemReturnProps {
  orderItemId: string;
  productName: string;
  orderStatus: string;
  existingRequests: ReturnRequest[];
}

const REQUESTABLE = ["DELIVERED"];

export default function OrderItemReturn({ orderItemId, productName, orderStatus, existingRequests }: OrderItemReturnProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"RETURN" | "REPLACEMENT">("RETURN");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<{ path: string; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const active = existingRequests.find((r) => ["PENDING", "APPROVED", "PICKED_UP"].includes(r.status));
  const canRequest = REQUESTABLE.includes(orderStatus) && !active;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls: { path: string; previewUrl: string }[] = [];
      for (const file of files) {
        if (images.length + urls.length >= 5) break;
        const { path, previewUrl } = await uploadReturnImage(file);
        urls.push({ path, previewUrl });
      }
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    setLoading(true);
    try {
      await requestReturn(orderItemId, type, reason, images.map((i) => i.path));
      toast.success(`${type === "RETURN" ? "Return" : "Replacement"} request submitted!`);
      setOpen(false);
      setReason("");
      setImages([]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (requestId: string) => {
    setLoading(true);
    try {
      await cancelReturnRequest(requestId);
      toast.success("Request cancelled.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#7A0B2E]/10">
      {active ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-none
            ${active.status === "PICKED_UP" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
              active.status === "APPROVED" ? "bg-blue-50 text-blue-700 border-blue-200" :
              "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
            {active.type} · {active.status.replace(/_/g, " ")}
          </span>
          {active.status === "PENDING" && (
            <button
              onClick={() => cancel(active.id)}
              disabled={loading}
              className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
            >
              Cancel Request
            </button>
          )}
        </div>
      ) : canRequest ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => { setType("RETURN"); setOpen(true); }}
            className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] bg-white border border-[#7A0B2E]/30 px-3.5 py-2 hover:bg-[#7A0B2E] hover:text-white hover:border-[#7A0B2E] transition-all duration-200 rounded-none shadow-sm"
          >
            Request Return
          </button>
          <button
            onClick={() => { setType("REPLACEMENT"); setOpen(true); }}
            className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] bg-white border border-[#7A0B2E]/30 px-3.5 py-2 hover:bg-[#7A0B2E] hover:text-white hover:border-[#7A0B2E] transition-all duration-200 rounded-none shadow-sm"
          >
            Request Replacement
          </button>
        </div>
      ) : null}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-none border border-[#7A0B2E]/20 shadow-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-serif text-[#2D1F2F] mb-1 tracking-wide">
              {type === "RETURN" ? "Request a Return" : "Request a Replacement"}
            </h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">{productName}</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-1">Type</label>
                <div className="flex gap-2">
                  {(["RETURN", "REPLACEMENT"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-none border transition-colors
                        ${type === t ? "bg-[#7A0B2E] text-white border-[#7A0B2E]" : "bg-[#F5EFE6] text-[#2D1F2F] border-[#7A0B2E]/30"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-1">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-none border border-[#7A0B2E]/30 px-3 py-2 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
                  placeholder="Tell us why you'd like to {type.toLowerCase()} this item..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-1">
                  Photos (Optional, up to 5)
                </label>
                <label className="flex items-center justify-center gap-2 border border-dashed border-[#7A0B2E]/40 px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:bg-[#F5EFE6] cursor-pointer rounded-none">
                  <i className="ri-camera-line text-lg" />
                  {uploading ? "Uploading..." : "Add photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading || images.length >= 5}
                    onChange={handleFiles}
                    className="hidden"
                  />
                </label>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map((img, idx) => (
                      <div key={img.path} className="relative w-16 h-16 border border-[#7A0B2E]/30 overflow-hidden rounded-none">
                        <Image src={img.previewUrl} alt={`Return photo ${idx + 1}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute top-0 right-0 bg-black/60 text-white text-xs w-5 h-5 flex items-center justify-center"
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#7A0B2E]/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#2D1F2F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-50"
                >
                  {loading && <i className="ri-loader-4-line animate-spin text-sm" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
