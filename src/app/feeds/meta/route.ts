import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600;

// Meta (Facebook/Instagram) catalog feed (CSV). One row per product.
// Submit as: {APP_URL}/feeds/meta
// Matches the "catalog_products" template columns in files/ (derive-only, no migration).

const BRAND = "Myra";

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function absUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

function attrsOf(product: { attributes: unknown }): Record<string, string> {
  if (product.attributes && typeof product.attributes === "object" && !Array.isArray(product.attributes)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(product.attributes as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
      else if (typeof v === "number") out[k] = String(v);
    }
    return out;
  }
  return {};
}

function genderFor(productType: string | null | undefined): string {
  const t = (productType || "").toLowerCase();
  if (t.includes("kid")) return "unisex";
  if (["saree", "lehenga", "suit", "anarkali", "kurti", "dress", "gown", "top", "ethnic", "western"].some((k) => t.includes(k))) return "female";
  return "unisex";
}

function ageGroupFor(productType: string | null | undefined): string {
  const t = (productType || "").toLowerCase();
  if (t.includes("kid")) return "children";
  return "adult";
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myrashoppingmall.com";

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { variants: true, collection: { select: { name: true, slug: true } } },
    orderBy: { updatedAt: "desc" },
    take: 10000,
  });

  const headers = [
    "id",
    "title",
    "description",
    "availability",
    "condition",
    "link",
    "image_link",
    "brand",
    "price",
    "sale_price",
    "quantity_to_sell_on_facebook",
    "item_group_id",
    "gender",
    "color",
    "size",
    "age_group",
    "material",
    "pattern",
    "google_product_category",
    "fb_product_category",
  ];

  const googleCategoryFor = (productType: string | null | undefined): string => {
    const t = (productType || "").toLowerCase();
    if (t.includes("saree")) return "Apparel & Accessories > Clothing";
    if (t.includes("lehenga") || t.includes("gown") || t.includes("dress")) return "Apparel & Accessories > Clothing";
    return "Apparel & Accessories > Clothing";
  };

  const rows = products.map((p) => {
    const attrs = attrsOf(p);
    const desc = stripHtml(p.description).slice(0, 1000) || `Shop ${p.name} at Myra Shopping Mall.`;
    const link = `${baseUrl}/products/${p.slug}`;
    const imageLink = p.images[0] ? absUrl(p.images[0], baseUrl) : "";
    const availability = p.stockQuantity > 0 ? "in stock" : "out of stock";

    const onSale = p.originalPrice != null && p.originalPrice > p.price;
    const price = `${(onSale ? p.originalPrice! : p.price).toFixed(2)} INR`;
    const salePrice = onSale ? `${p.price.toFixed(2)} INR` : "";

    const colors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))] as string[];
    const sizes = [...new Set(p.variants.map((v) => v.size).filter(Boolean))] as string[];
    const material = attrs["Material / Fabric"] || p.material || "";
    const pattern =
      attrs["Pattern / Weave"] ||
      attrs["Pattern / Print"] ||
      attrs["Pattern / Silhouette"] ||
      attrs["Work / Pattern"] ||
      attrs["Work / Embellishment"] ||
      "";

    return [
      p.sku || p.id,
      p.name.slice(0, 150),
      desc,
      availability,
      "new",
      link,
      imageLink,
      BRAND,
      price,
      salePrice,
      p.stockQuantity,
      p.variants.length > 0 ? p.id : "",
      genderFor(p.productType),
      colors.join(", "),
      sizes.join(", "),
      ageGroupFor(p.productType),
      material,
      pattern,
      googleCategoryFor(p.productType),
      p.collection?.name || p.productType || "",
    ]
      .map(csvCell)
      .join(",");
  });

  const body = [headers.join(","), ...rows].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
