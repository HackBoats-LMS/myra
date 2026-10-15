import { prisma } from "@/lib/db/prisma";

export const revalidate = 3600;

// Google Merchant Center product feed (TSV). One row per product.
// Submit as: {APP_URL}/feeds/google
// Derive-only mapping: no new Prisma columns (per setup decision).

const BRAND = "Myra";

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
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

function googleCategoryFor(productType: string | null | undefined): string {
  const t = (productType || "").toLowerCase();
  if (t.includes("saree")) return "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing";
  if (t.includes("lehenga") || t.includes("gown")) return "Apparel & Accessories > Clothing > Dresses";
  if (t.includes("suit") || t.includes("anarkali") || t.includes("kurti")) return "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing";
  if (t.includes("dress")) return "Apparel & Accessories > Clothing > Dresses";
  if (t.includes("top")) return "Apparel & Accessories > Clothing > Shirts & Tops";
  if (t.includes("bottom")) return "Apparel & Accessories > Clothing > Pants";
  if (t.includes("kid")) return "Apparel & Accessories > Clothing > Children's Clothing";
  return "Apparel & Accessories > Clothing";
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
    "link",
    "image_link",
    "additional_image_link",
    "availability",
    "price",
    "sale_price",
    "brand",
    "condition",
    "identifier_exists",
    "color",
    "size",
    "gender",
    "age_group",
    "material",
    "pattern",
    "google_product_category",
    "product_type",
    "item_group_id",
    "product_highlight",
    "product_detail",
  ];

  const rows = products.map((p) => {
    const attrs = attrsOf(p);
    const desc = stripHtml(p.description).slice(0, 1000) || `Shop ${p.name} at Myra Shopping Mall.`;
    const link = `${baseUrl}/products/${p.slug}`;
    const imageLink = p.images[0] ? absUrl(p.images[0], baseUrl) : "";
    const additional = p.images.slice(1, 11).map((u) => absUrl(u, baseUrl)).join(",");
    const availability = p.stockQuantity > 0 ? "in_stock" : "out_of_stock";

    // GMC convention: price = regular (MRP), sale_price = discounted.
    const onSale = p.originalPrice != null && p.originalPrice > p.price;
    const price = `${(onSale ? p.originalPrice! : p.price).toFixed(2)} INR`;
    const salePrice = onSale ? `${p.price.toFixed(2)} INR` : "";

    const colors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))] as string[];
    const sizes = [...new Set(p.variants.map((v) => v.size).filter(Boolean))] as string[];
    const material =
      attrs["Material / Fabric"] || p.material || "";
    const pattern =
      attrs["Pattern / Weave"] ||
      attrs["Pattern / Print"] ||
      attrs["Pattern / Silhouette"] ||
      attrs["Work / Pattern"] ||
      attrs["Work / Embellishment"] ||
      "";
    const detail = Object.entries(attrs)
      .slice(0, 10)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");

    return [
      p.sku || p.id,
      p.name.slice(0, 150),
      desc,
      link,
      imageLink,
      additional,
      availability,
      price,
      salePrice,
      BRAND,
      "new",
      "no",
      colors.join("/"),
      sizes.join("/"),
      genderFor(p.productType),
      ageGroupFor(p.productType),
      material,
      pattern,
      googleCategoryFor(p.productType),
      p.productType || p.collection?.name || "",
      p.variants.length > 0 ? p.id : "",
      desc.slice(0, 150),
      detail,
    ]
      .map(tsvCell)
      .join("\t");
  });

  const body = [headers.join("\t"), ...rows].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
