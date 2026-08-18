"use client";
import { useEffect, useRef } from "react";
import { trackProductView } from "@/actions/storefront/recently-viewed";

export default function RecentlyViewedTracker({ productId }: { productId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackProductView(productId);
  }, [productId]);
  return null;
}