import type { Metadata } from "next";
import { Inria_Serif } from "next/font/google";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import { ToastProvider } from "@/components/ui/Toast";
import { headers } from "next/headers";

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
import { NavigationProgressBar } from "@/components/shared/NavigationProgressBar";
import Script from "next/script";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get("x-csp-nonce") || "";

  return (
    <html
      lang="en"
      className={`${inria.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <Script
          id="animation-check"
          strategy="beforeInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              if (sessionStorage.getItem('myra_animation_played')) {
                  var style = document.createElement('style');
                  style.innerHTML = '#myra-opening-anim { display: none !important; }';
                  document.head.appendChild(style);
              }
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NavigationProgressBar />
        <WebVitals />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
