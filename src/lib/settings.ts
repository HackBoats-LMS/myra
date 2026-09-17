import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  footerAbout: string;
  taxPercent: number;
  promoEnabled: boolean;
  promoText: string;
  promoLink: string;
  homePromoEnabled: boolean;
  homePromoText: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Myra Shopping Mall",
  supportEmail: "support@myra.com",
  supportPhone: "+91 91777 51481",
  footerAbout: "Curated sarees and ethnic wear crafted for every celebration.",
  taxPercent: 0,
  promoEnabled: false,
  promoText: "Complimentary shipping worldwide · Orders delivered within 3-5 business days",
  promoLink: "",
  homePromoEnabled: true,
  homePromoText: "Enjoy Free Shipping on Orders Over ₹2000! ✨",
};

export const getStoreSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    try {
      const settings = await prisma.storeSetting.findMany();
      const map = new Map(settings.map((s) => [s.key, s.value]));
      return {
        storeName: map.get("storeName") || DEFAULT_SETTINGS.storeName,
        supportEmail: map.get("supportEmail") || DEFAULT_SETTINGS.supportEmail,
        supportPhone: map.get("supportPhone") || DEFAULT_SETTINGS.supportPhone,
        footerAbout: map.get("footerAbout") || DEFAULT_SETTINGS.footerAbout,
        taxPercent: parseFloat(map.get("taxPercent") || "0") || 0,
        promoEnabled: map.get("promoEnabled") === "true",
        promoText: map.get("promoText") ?? DEFAULT_SETTINGS.promoText,
        promoLink: map.get("promoLink") ?? DEFAULT_SETTINGS.promoLink,
        homePromoEnabled: map.get("homePromoEnabled") ? map.get("homePromoEnabled") === "true" : DEFAULT_SETTINGS.homePromoEnabled,
        homePromoText: map.get("homePromoText") ?? DEFAULT_SETTINGS.homePromoText,
      };
    } catch (error) {
      console.warn("Database unreachable in getStoreSettings, using defaults:", error instanceof Error ? error.message : "unknown error");
      return DEFAULT_SETTINGS;
    }
  },
  ["store-settings"],
  { tags: ["store_settings"] }
);
