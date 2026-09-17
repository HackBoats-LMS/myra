"use client";

import { usePathname } from "next/navigation";

export default function HomePagePromoBar({
  enabled,
  text,
}: {
  enabled: boolean;
  text: string;
}) {
  const pathname = usePathname();

  if (!enabled || pathname !== "/") {
    return null;
  }

  return (
    <div className="w-full bg-[#7A0B2E] text-white text-center py-2 text-sm font-medium tracking-wide">
      {text}
    </div>
  );
}
