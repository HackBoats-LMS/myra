"use client";
import { useState } from "react";
import Image from "next/image";
import ImageUpload from "@/app/(admin)/admin/_components/ImageUpload";
import { upsertBanner, deleteBanner } from "@/actions/banners";
import { useToast } from "@/components/ui/Toast";
import { Zap, Info, Loader2, Save, Sparkles } from "lucide-react";

export interface BannerRecord {
  id: string;
  slot: string;
  title: string | null;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  isActive: boolean;
}

interface BannerSlotConfig {
  slot: string;
  title: string;
  description: string;
  aspectRatio: string;
  recommendedResolution: string;
  defaultImage: string;
  defaultLink: string;
  defaultSubtitle?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  hasEditorialFields?: boolean;
}

const BANNER_SLOTS: BannerSlotConfig[] = [
  {
    slot: "hero_main",
    title: "Main Left Hero Banner",
    description: "The primary high-impact banner on the left side of the homepage hero.",
    aspectRatio: "3:2",
    recommendedResolution: "2400 × 1600 px (3:2 ratio)",
    defaultImage: "/displaypics/hero-main.png",
    defaultLink: "/collections/sales",
  },
  {
    slot: "hero_right_top",
    title: "Top Right Hero Banner",
    description: "The upper banner in the right stacked hero column.",
    aspectRatio: "2:1",
    recommendedResolution: "1600 × 800 px (2:1 ratio)",
    defaultImage: "/displaypics/landingpage2.png",
    defaultLink: "/collections/women",
  },
  {
    slot: "hero_right_bottom",
    title: "Bottom Right Hero Banner",
    description: "The lower banner in the right stacked hero column.",
    aspectRatio: "2:1",
    recommendedResolution: "1600 × 800 px (2:1 ratio)",
    defaultImage: "/displaypics/landingpage3.png",
    defaultLink: "/collections/kids",
  },
  {
    slot: "bridal_banner",
    title: "Bridal Elegance Banner",
    description: "The full-width promotional banner featured in the middle of the homepage.",
    aspectRatio: "21:9",
    recommendedResolution: "1920 × 600 px (Wide format)",
    defaultImage: "/displaypics/bribal poster.png",
    defaultLink: "/collections/bridal",
  },
  {
    slot: "curated_story_1",
    title: "Curated Showcase — Story 01",
    description: "The first curated story block in the homepage brand showcase.",
    aspectRatio: "4:3",
    recommendedResolution: "1200 × 900 px (4:3 ratio)",
    defaultImage: "/displaypics/brandIdentity/1.png",
    defaultLink: "/collections/sarees",
    defaultSubtitle: "Where Every Saree Becomes a Statement",
    defaultTitle: "Curated for Every Celebration",
    defaultDescription:
      "Discover a thoughtfully curated collection of silk, designer, and everyday sarees, along with elegant women's wear for every occasion. At Myra Shopping Mall, quality, craftsmanship, and timeless style come together to help you celebrate life's most beautiful moments.",
    hasEditorialFields: true,
  },
  {
    slot: "curated_story_2",
    title: "Curated Showcase — Story 02",
    description: "The second curated story block in the homepage brand showcase.",
    aspectRatio: "4:3",
    recommendedResolution: "1200 × 900 px (4:3 ratio)",
    defaultImage: "/displaypics/brandIdentity/2.png",
    defaultLink: "/collections/women",
    defaultSubtitle: "Style Beyond Trends",
    defaultTitle: "Fashion That Defines You",
    defaultDescription:
      "Discover contemporary women's wear designed for confidence, comfort, and effortless style. From casual essentials to statement pieces, Myra Shopping Mall brings you the latest collections for every occasion.",
    hasEditorialFields: true,
  },
];

export default function BannerManager({ initialBanners }: { initialBanners: BannerRecord[] }) {
  const toast = useToast();
  const [banners, setBanners] = useState<Record<string, Partial<BannerRecord>>>(() => {
    const map: Record<string, Partial<BannerRecord>> = {};
    initialBanners.forEach((b) => {
      map[b.slot] = b;
    });
    return map;
  });

  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [resettingSlot, setResettingSlot] = useState<string | null>(null);

  const handleFieldChange = (slot: string, field: keyof BannerRecord, value: string) => {
    setBanners((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [field]: value,
      },
    }));
  };

  const handleSave = async (config: BannerSlotConfig) => {
    const current = banners[config.slot];
    const imageUrl = current?.imageUrl || config.defaultImage;

    if (!imageUrl) {
      toast.error("Please provide an image before saving.");
      return;
    }

    try {
      setSavingSlot(config.slot);
      const saved = await upsertBanner({
        slot: config.slot,
        imageUrl,
        linkUrl: current?.linkUrl ?? config.defaultLink,
        title: current?.title ?? config.defaultTitle ?? config.title,
        subtitle: current?.subtitle ?? config.defaultSubtitle ?? null,
        description: current?.description ?? config.defaultDescription ?? null,
        altText: current?.altText ?? config.title,
      });

      setBanners((prev) => ({
        ...prev,
        [config.slot]: saved,
      }));

      toast.success(`${config.title} updated! Storefront cache revalidated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save banner.");
    } finally {
      setSavingSlot(null);
    }
  };

  const handleReset = async (config: BannerSlotConfig) => {
    try {
      setResettingSlot(config.slot);
      await deleteBanner(config.slot);

      setBanners((prev) => {
        const next = { ...prev };
        delete next[config.slot];
        return next;
      });

      toast.success(`${config.title} reset to default!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset banner.");
    } finally {
      setResettingSlot(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* SSR Caching Info Card */}
      <div className="bg-[#2D1F2F]/5 border border-[#7A0B2E]/30 p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-[#2D1F2F] text-[#7A0B2E] flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-serif font-bold text-sm text-[#2D1F2F]">Instant Server Cache with On-Demand Revalidation</h4>
          <p className="text-gray-600 leading-relaxed">
            All banner and curated story updates are cached server-side. Page views serve immediately from high-speed memory with <strong>0 database delay</strong>. The cache automatically purges and reloads across the storefront only when you save changes here.
          </p>
        </div>
      </div>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {BANNER_SLOTS.map((config) => {
          const bannerData = banners[config.slot];
          const hasCustom = !!bannerData?.imageUrl || !!bannerData?.title || !!bannerData?.subtitle;
          const displayImage = bannerData?.imageUrl || config.defaultImage;
          const isSaving = savingSlot === config.slot;
          const isResetting = resettingSlot === config.slot;

          return (
            <div
              key={config.slot}
              className="bg-white border border-[#7A0B2E]/20 shadow-sm p-6 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg font-bold text-[#2D1F2F]">{config.title}</h3>
                      {config.hasEditorialFields && (
                        <span className="bg-[#2D1F2F] text-[#7A0B2E] text-[9px] px-2 py-0.5 font-mono uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Story Block
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                  <span className="inline-block bg-[#7A0B2E]/15 text-[#2D1F2F] border border-[#7A0B2E]/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {config.aspectRatio} Ratio
                  </span>
                </div>

                {/* Sizing recommendation badge */}
                <div className="bg-[#F5EFE6] border border-gray-200 px-3 py-2 text-[11px] text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#7A0B2E] shrink-0" />
                  <span>
                    Recommended Size: <strong>{config.recommendedResolution}</strong>
                  </span>
                </div>

                {/* Image Preview & Upload */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                    Current Image {bannerData?.imageUrl ? "(Custom Image)" : "(Default Image)"}
                  </label>
                  <div className="relative w-full h-52 bg-slate-100 border border-dashed border-[#7A0B2E]/40 overflow-hidden flex items-center justify-center">
                    <Image
                      src={displayImage}
                      alt={bannerData?.altText || config.title}
                      fill
                      unoptimized={displayImage.startsWith("http")}
                      className="object-contain object-center"
                    />
                  </div>
                </div>

                {/* Image Uploader */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                    Upload New Image
                  </label>
                  <ImageUpload
                    value={bannerData?.imageUrl || ""}
                    onChange={(url) => handleFieldChange(config.slot, "imageUrl", url)}
                  />
                </div>

                {/* Editorial Subtitle, Title & Description if Story Block */}
                {config.hasEditorialFields ? (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    {/* Subtitle / Eyebrow */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                        Story Subtitle (Eyebrow Text)
                      </label>
                      <input
                        type="text"
                        placeholder={config.defaultSubtitle}
                        value={bannerData?.subtitle ?? ""}
                        onChange={(e) => handleFieldChange(config.slot, "subtitle", e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                      />
                    </div>

                    {/* Headline Title */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                        Headline Title
                      </label>
                      <input
                        type="text"
                        placeholder={config.defaultTitle}
                        value={bannerData?.title ?? ""}
                        onChange={(e) => handleFieldChange(config.slot, "title", e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                      />
                    </div>

                    {/* Description Text */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                        Story Description
                      </label>
                      <textarea
                        rows={4}
                        placeholder={config.defaultDescription}
                        value={bannerData?.description ?? ""}
                        onChange={(e) => handleFieldChange(config.slot, "description", e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#2D1F2F] resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard Banner Title & Alt */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                        Banner Title
                      </label>
                      <input
                        type="text"
                        placeholder={config.title}
                        value={bannerData?.title || ""}
                        onChange={(e) => handleFieldChange(config.slot, "title", e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        placeholder={config.title}
                        value={bannerData?.altText || ""}
                        onChange={(e) => handleFieldChange(config.slot, "altText", e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                      />
                    </div>
                  </div>
                )}

                {/* Destination Link */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">
                    Link URL
                  </label>
                  <input
                    type="text"
                    placeholder={config.defaultLink}
                    value={bannerData?.linkUrl || ""}
                    onChange={(e) => handleFieldChange(config.slot, "linkUrl", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-[#2D1F2F]"
                  />
                  <p className="text-[10px] text-gray-400">Example: /collections/sarees or https://...</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => void handleSave(config)}
                  disabled={isSaving || isResetting}
                  className="flex-1 bg-[#2D1F2F] hover:bg-[#220510] text-white py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
                {hasCustom && (
                  <button
                    type="button"
                    onClick={() => void handleReset(config)}
                    disabled={isSaving || isResetting}
                    className="bg-white border border-red-300 text-red-600 hover:bg-red-50 py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {isResetting ? "Resetting..." : "Reset"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
