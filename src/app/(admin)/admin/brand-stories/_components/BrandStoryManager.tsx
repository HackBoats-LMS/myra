"use client";
import React, { useState } from "react";
import Image from "next/image";
import ImageUpload from "@/app/(admin)/admin/_components/ImageUpload";
import {
  createBrandStory,
  updateBrandStory,
  deleteBrandStory,
  toggleBrandStoryActive,
  reorderBrandStories,
} from "@/actions/brand-stories";
import { useToast } from "@/components/ui/Toast";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  Loader2,
  X,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from "lucide-react";

export interface BrandStoryRecord {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FormData {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  altText: "",
  isActive: true,
};

export default function BrandStoryManager({ initialStories }: { initialStories: BrandStoryRecord[] }) {
  const toast = useToast();
  const [stories, setStories] = useState<BrandStoryRecord[]>(initialStories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (story: BrandStoryRecord) => {
    setFormData({
      id: story.id,
      title: story.title,
      subtitle: story.subtitle || "",
      description: story.description || "",
      imageUrl: story.imageUrl,
      linkUrl: story.linkUrl || "",
      altText: story.altText || "",
      isActive: story.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a story title.");
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error("Please upload or provide an image URL.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (formData.id) {
        // Update
        const updated = await updateBrandStory(formData.id, {
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          imageUrl: formData.imageUrl,
          linkUrl: formData.linkUrl || null,
          altText: formData.altText || null,
          isActive: formData.isActive,
        });

        setStories((prev) =>
          prev.map((s) => (s.id === updated.id ? (updated as BrandStoryRecord) : s))
        );
        toast.success("Brand story updated! Storefront cache revalidated.");
      } else {
        // Create
        const created = await createBrandStory({
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          imageUrl: formData.imageUrl,
          linkUrl: formData.linkUrl || null,
          altText: formData.altText || null,
          isActive: formData.isActive,
        });

        setStories((prev) => [...prev, created as BrandStoryRecord]);
        toast.success("New brand story created! Storefront cache revalidated.");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save brand story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setDeletingId(id);
      await deleteBrandStory(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      toast.success("Brand story deleted! Storefront cache revalidated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete story.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (story: BrandStoryRecord) => {
    const nextActive = !story.isActive;
    // Optimistic update
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, isActive: nextActive } : s))
    );

    try {
      await toggleBrandStoryActive(story.id, nextActive);
      toast.success(`Story ${nextActive ? "published" : "hidden"} on storefront.`);
    } catch (err) {
      // Revert
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, isActive: story.isActive } : s))
      );
      toast.error("Failed to update status.");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stories.length) return;

    const newStories = [...stories];
    const [moved] = newStories.splice(index, 1);
    newStories.splice(targetIndex, 0, moved);

    setStories(newStories);

    try {
      await reorderBrandStories(newStories.map((s) => s.id));
      toast.success("Story order updated.");
    } catch (err) {
      setStories(stories);
      toast.error("Failed to save reordering.");
    }
  };

  return (
    <div className="space-y-8">
      {/* SSR Caching Info Card */}
      <div className="bg-[#2D1F2F]/5 border border-[#7A0B2E]/30 p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#2D1F2F] text-[#7A0B2E] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-serif font-bold text-sm text-[#2D1F2F]">
              Dynamic Brand Stories & SSR Cache
            </h4>
            <p className="text-gray-600 leading-relaxed max-w-2xl">
              Stories added here appear in the homepage Curated Brand Showcase. Storefront queries are served from <strong>Next.js memory cache with 0 database delay</strong>, automatically refreshing whenever you add, edit, or reorder stories.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="bg-[#2D1F2F] hover:bg-[#220510] text-white py-2.5 px-5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Story
        </button>
      </div>

      {/* Stories List */}
      {stories.length === 0 ? (
        <div className="bg-white border border-[#7A0B2E]/20 p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-[#7A0B2E]/15 text-[#2D1F2F] rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#2D1F2F]">No Custom Brand Stories Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            The storefront is currently showing the 2 default built-in stories. Click &quot;Add New Story&quot; to create your first custom story with images and narrative text!
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#2D1F2F] hover:bg-[#220510] text-white py-2.5 px-5 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Story
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story, index) => {
            const isDeleting = deletingId === story.id;

            return (
              <div
                key={story.id}
                className={`bg-white border transition-all duration-200 p-6 flex flex-col justify-between space-y-5 shadow-sm ${
                  story.isActive
                    ? "border-[#7A0B2E]/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                    : "border-gray-200 opacity-60 bg-gray-50/50"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Chapter Number, Status & Ordering */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#2D1F2F] text-[#7A0B2E] text-xs font-mono font-bold flex items-center justify-center shadow-xs">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 border ${
                          story.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {story.isActive ? "Visible in Showcase" : "Hidden"}
                      </span>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleMove(index, "up")}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleMove(index, "down")}
                        disabled={index === stories.length - 1}
                        title="Move Down"
                        className="p-1 hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image Preview & Details Grid */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Image Preview */}
                    <div className="relative w-full sm:w-36 h-36 bg-slate-100 border border-[#7A0B2E]/30 overflow-hidden shrink-0 flex items-center justify-center">
                      <Image
                        src={story.imageUrl}
                        alt={story.title}
                        fill
                        unoptimized={story.imageUrl.startsWith("http")}
                        className="object-contain object-center"
                      />
                    </div>

                    {/* Text Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {story.subtitle && (
                        <p className="text-[11px] font-serif font-bold text-[#7A0B2E] uppercase tracking-wider line-clamp-1">
                          {story.subtitle}
                        </p>
                      )}
                      <h3 className="font-serif text-base font-bold text-[#2D1F2F] line-clamp-1">
                        {story.title}
                      </h3>
                      {story.description && (
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                          {story.description}
                        </p>
                      )}
                      {story.linkUrl && (
                        <div className="flex items-center gap-1 text-[11px] text-[#2D1F2F] font-mono pt-1">
                          <LinkIcon className="w-3 h-3 text-[#7A0B2E]" />
                          <span className="truncate">{story.linkUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(story)}
                    className={`text-xs px-3 py-1.5 border font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      story.isActive
                        ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                        : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    {story.isActive ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Publish
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(story)}
                      className="bg-[#2D1F2F] hover:bg-[#220510] text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(story.id, story.title)}
                      disabled={isDeleting}
                      className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#7A0B2E]/30 w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7A0B2E]" />
                <h3 className="font-serif text-xl font-bold text-[#2D1F2F]">
                  {formData.id ? "Edit Brand Story" : "Add New Brand Story"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                  Story Image (Required)
                </label>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                />
                <p className="text-[10px] text-gray-400">
                  Recommended size: 1200 × 900 px (4:3 aspect ratio).
                </p>
              </div>

              {/* Subtitle / Eyebrow */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                  Subtitle / Eyebrow
                </label>
                <input
                  type="text"
                  placeholder="e.g. Where Every Saree Becomes a Statement"
                  value={formData.subtitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full border border-gray-300 px-3.5 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                />
              </div>

              {/* Main Headline Title */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                  Headline Title (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Curated for Every Celebration"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 px-3.5 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                  Story Narrative Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter the storytelling narrative for this chapter..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3.5 py-2 text-xs focus:outline-none focus:border-[#2D1F2F] resize-none"
                />
              </div>

              {/* Link URL */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                  Destination Link URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /collections/sarees"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  className="w-full border border-gray-300 px-3.5 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 px-5 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2D1F2F] hover:bg-[#220510] text-white py-2.5 px-6 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    formData.id ? "Save Changes" : "Create Story"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
