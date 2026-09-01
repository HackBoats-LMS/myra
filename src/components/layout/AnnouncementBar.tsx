import Link from "next/link";
import { getStoreSettings } from "@/lib/settings";

function isSafeUrl(href: string): boolean {
  try {
    const parsed = new URL(href, "https://placeholder.local");
    if (/^(javascript|data|vbscript):/i.test(parsed.protocol)) return false;
    if (href.trimStart().startsWith("//")) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function AnnouncementBar() {
  const settings = await getStoreSettings();
  if (!settings.promoEnabled || !settings.promoText) {
    return null;
  }

  const inner = (
    <span className="flex items-center justify-center gap-2">
      {settings.promoText}
    </span>
  );

  return (
    <div className="w-full bg-[#B6925B] text-white py-1 px-4 text-center text-[9px] md:text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all">
      {settings.promoLink && isSafeUrl(settings.promoLink) ? (
        <Link href={settings.promoLink} className="hover:underline inline-block">{inner}</Link>
      ) : (
        inner
      )}
    </div>
  );
}
