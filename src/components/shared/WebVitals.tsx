"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (metric.name === "FCP" || metric.name === "LCP" || metric.name === "TTFB") {
      console.debug(metric);
    }
  });

  return null;
}