"use client";
import { useState } from "react";
import Image from "next/image";
import { submitReview, uploadReviewImage } from "@/actions/review";
import { useToast } from "@/components/ui/Toast";

interface ExistingReview {
  rating: number;
  comment: string | null;
  images?: string[];
}

export default function OrderItemReview({
  productId,
  productName,
  existingReview,
}: {
  productId: string;
  productName: string;
  existingReview: ExistingReview | null;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(Boolean(existingReview));
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [images, setImages] = useState<{ path: string; previewUrl: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const added: { path: string; previewUrl: string }[] = [];
      for (const file of files) {
        if (images.length + added.length >= 5) break;
        added.push(await uploadReviewImage(file));
      }
      setImages((prev) => [...prev, ...added].slice(0, 5));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitReview(productId, rating, comment, images.map((i) => i.path));
      toast.success(existingReview ? "Review updated!" : "Review submitted!");
      setOpen(true);
      setImages([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[#B6925B]/10 pt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors"
        >
          <i className="ri-star-line text-sm" />
          Write a Review
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-[#FAFAFA] border border-[#B6925B]/20 p-4">
          <p className="text-[11px] font-bold text-[#4A3B2C] uppercase tracking-widest">{productName}</p>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-[#B6925B] focus:outline-none transition-transform active:scale-95 flex items-center justify-center"
              >
                {star <= (hoverRating || rating) ? (
                  <i className="ri-star-fill text-xl" />
                ) : (
                  <i className="ri-star-line text-xl text-gray-300 hover:text-[#B6925B]" />
                )}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={3}
            className="w-full bg-white border border-[#B6925B]/20 rounded-none p-3 text-xs focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] placeholder-gray-400 resize-none"
          />

          <div>
            <label className="flex items-center justify-center gap-2 border border-dashed border-[#B6925B]/40 px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:bg-white cursor-pointer rounded-none">
              <i className="ri-camera-line text-lg" />
              {uploading ? "Uploading..." : "Add photos (up to 5)"}
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
                  <div key={img.path} className="relative w-14 h-14 border border-[#B6925B]/30 overflow-hidden rounded-none">
                    <Image src={img.previewUrl} alt={`Review photo ${idx + 1}`} fill className="object-cover" />
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

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A3B2C] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <i className="ri-loader-4-line animate-spin text-sm leading-none" />
              ) : existingReview ? (
                "Update Review"
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}