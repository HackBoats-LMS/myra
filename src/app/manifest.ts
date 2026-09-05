import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Myra Shopping Mall",
    short_name: "Myra",
    description: "Curated sarees and ethnic wear crafted for every celebration.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5EFE6",
    theme_color: "#7A0B2E",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
