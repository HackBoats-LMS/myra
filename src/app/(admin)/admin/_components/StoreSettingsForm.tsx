"use client";
import { useState } from "react";
import { updateStoreSettings } from "@/actions/settings";
import { useToast } from "@/components/ui/Toast";

interface StoreSettingsFormProps {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  footerAbout: string;
  taxPercent: number;
  promoEnabled: boolean;
  promoText: string;
  promoLink: string;
}

export default function StoreSettingsForm(props: StoreSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateStoreSettings(formData);
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full px-4 py-2 border border-[#B6925B]/20 rounded-none bg-white focus:outline-none focus:border-[#B6925B] text-[#4A3B2C]";
  const label = "block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={label} htmlFor="storeName">Store Name *</label>
          <input id="storeName" name="storeName" required defaultValue={props.storeName} className={field} />
        </div>
        <div className="space-y-2">
          <label className={label} htmlFor="supportEmail">Support Email</label>
          <input id="supportEmail" name="supportEmail" type="email" defaultValue={props.supportEmail} className={field} />
        </div>
        <div className="space-y-2">
          <label className={label} htmlFor="supportPhone">Support Phone</label>
          <input id="supportPhone" name="supportPhone" defaultValue={props.supportPhone} className={field} />
        </div>
        <div className="space-y-2">
          <label className={label} htmlFor="taxPercent">Tax / GST %</label>
          <input id="taxPercent" name="taxPercent" type="number" min="0" max="100" step="0.01" defaultValue={props.taxPercent} className={field} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className={label} htmlFor="footerAbout">Footer About Text</label>
          <textarea id="footerAbout" name="footerAbout" rows={3} defaultValue={props.footerAbout} className={field} />
        </div>
      </div>

      <div className="border-t border-[#B6925B]/20 pt-6">
        <h3 className="font-serif text-lg text-[#4A3B2C] mb-4">Promo Banner</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="promoEnabled" defaultChecked={props.promoEnabled} className="accent-[#B6925B]" />
              <span className="text-[10px] font-bold text-[#4A3B2C] uppercase tracking-widest">Show promo banner at the top of the store</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className={label} htmlFor="promoText">Banner Text</label>
            <input id="promoText" name="promoText" defaultValue={props.promoText} placeholder="e.g. 20% off sarees this weekend" className={field} />
          </div>
          <div className="space-y-2">
            <label className={label} htmlFor="promoLink">Banner Link (optional)</label>
            <input id="promoLink" name="promoLink" defaultValue={props.promoLink} placeholder="e.g. /collections/sarees" className={field} />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 rounded-none"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
