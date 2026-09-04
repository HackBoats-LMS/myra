import { getBrandStoriesAdmin } from "@/actions/brand-stories";
import BrandStoryManager from "./_components/BrandStoryManager";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Brand Stories & Showcase | Admin",
  description: "Manage homepage brand stories, chapters, imagery, and narrative text.",
};

export default async function AdminBrandStoriesPage() {
  const stories = await getBrandStoriesAdmin();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#7A0B2E]/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A0B2E] uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Homepage Showcase
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Brand Stories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add, customize, reorder, and publish curated brand stories and editorial showcases for the storefront.
          </p>
        </div>
      </div>

      {/* Main Manager Component */}
      <BrandStoryManager initialStories={stories} />
    </div>
  );
}
