import { getBannersAdmin } from "@/actions/banners";
import BannerManager from "./_components/BannerManager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await getBannersAdmin();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="border-b border-[#7A0B2E]/20 pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Banners & Media</h1>
        <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">
          Manage storefront marketing banners, promotions, and SSR cache
        </p>
      </div>

      <BannerManager initialBanners={banners} />
    </div>
  );
}
