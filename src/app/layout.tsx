import type { Metadata } from "next";
import { Inria_Serif } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inria = Inria_Serif({
  variable: "--font-inria",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Myra Shopping Mall",
    default: "Myra Shopping Mall - Premium Fashion & Lifestyle",
  },
  description: "Shop the latest premium fashion, accessories, and lifestyle products at Myra.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Myra Shopping Mall",
    description: "Premium fashion and lifestyle destination",
    url: "/",
    siteName: "Myra Shopping Mall",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Myra Shopping Mall",
    description: "Premium fashion and lifestyle destination",
  },
};

import { WebVitals } from "@/components/shared/WebVitals";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inria.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Skip to main content — keyboard/screen-reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#4A3B2C] focus:text-white focus:px-6 focus:py-3 focus:border focus:border-[#B6925B] focus:text-xs focus:font-bold focus:uppercase focus:tracking-widest focus:shadow-2xl"
        >
          Skip to main content
        </a>
        <WebVitals />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
