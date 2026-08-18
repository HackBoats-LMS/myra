"use client";

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Only log the core web vitals for performance telemetry
    if (['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'].includes(metric.name)) {
      console.log(`[Web Vitals] ${metric.name}:`, Math.round(metric.value * 10) / 10, 'ms');
      
      // Here you could send this to your analytics endpoint, for example:
      // fetch('/api/analytics', { body: JSON.stringify(metric), method: 'POST' })
    }
  });

  return null;
}
