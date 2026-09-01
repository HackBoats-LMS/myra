"use client";

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development" && ['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'].includes(metric.name)) {
      console.log(`[Web Vitals] ${metric.name}:`, Math.round(metric.value * 10) / 10, 'ms');
    }
  });

  return null;
}
