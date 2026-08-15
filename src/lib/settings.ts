import { prisma } from "@/lib/prisma";

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  footerAbout: string;
  taxPercent: number;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Myra Shopping Mall",
  supportEmail: "support@myra.com",
  supportPhone: "+91 00000 00000",
  footerAbout: "Curated sarees and ethnic wear crafted for every celebration.",
  taxPercent: 0,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await prisma.storeSetting.findMany();
  const map = new Map(settings.map((s) => [s.key, s.value]));
  return {
    storeName: map.get("storeName") || DEFAULT_SETTINGS.storeName,
    supportEmail: map.get("supportEmail") || DEFAULT_SETTINGS.supportEmail,
    supportPhone: map.get("supportPhone") || DEFAULT_SETTINGS.supportPhone,
    footerAbout: map.get("footerAbout") || DEFAULT_SETTINGS.footerAbout,
    taxPercent: parseFloat(map.get("taxPercent") || "0") || 0,
  };
}
