import { getStoreSettings } from "@/lib/settings";
import StoreSettingsForm from "@/app/(admin)/admin/_components/StoreSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-[#7A0B2E]/20 pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Store Settings</h1>
        <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">General store configuration</p>
      </div>

      <div className="bg-white border border-[#7A0B2E]/20 p-6 md:p-8 shadow-sm">
        <StoreSettingsForm {...settings} />
      </div>
    </div>
  );
}
