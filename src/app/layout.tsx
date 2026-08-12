import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
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

import { WebVitals } from "@/components/WebVitals";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Skip to main content — keyboard/screen-reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#0D3B66] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-bold focus:shadow-lg"
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
