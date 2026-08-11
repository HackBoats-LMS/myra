import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myrashoppingmall.com";

  // Static routes
  const staticRoutes = [
    "",
    "/collections",
    "/cart",
    "/wishlist",
    "/privacy",
    "/terms",
    "/returns",
    "/shipping",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic collections
  let collectionRoutes: any[] = [];
  try {
    const collections = await prisma.collection.findMany({ select: { slug: true, updatedAt: true } });
    collectionRoutes = collections.map((col) => ({
      url: `${baseUrl}/collections/${col.slug}`,
      lastModified: new Date(col.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error("Failed to fetch collections for sitemap:", e);
  }

  // Dynamic products
  let productRoutes: any[] = [];
  try {
    const products = await prisma.product.findMany({ select: { slug: true, updatedAt: true } });
    productRoutes = products.map((prod) => ({
      url: `${baseUrl}/products/${prod.slug}`,
      lastModified: new Date(prod.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("Failed to fetch products for sitemap:", e);
  }

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
