// purge-unbought-products.mjs
// Finds all Products with no OrderItems (never bought), deletes their images
// from Supabase Storage bucket "product-images", then hard-deletes the rows.
//
// Run from D:\myra\myra:
//   node purge-unbought-products.mjs

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/index.js";
import * as fs from "fs";

// ---- load .env ----
const envPath = ".env";
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) continue;
    const eqIdx = clean.indexOf("=");
    if (eqIdx < 0) continue;
    const key = clean.slice(0, eqIdx).trim();
    let val = clean.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "product-images";

// ---- Prisma setup (mirrors src/lib/db/prisma.ts) ----
const rawConn = process.env.DATABASE_URL || "";
const connectionString = rawConn.replace(/([?&])sslmode=[^&]+(&|$)/, "$1").replace(/[?&]$/, "");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function extractFileName(url) {
  const marker = "/storage/v1/object/public/" + BUCKET + "/";
  const idx = url.indexOf(marker);
  if (idx !== -1) return url.slice(idx + marker.length);
  return null;
}

async function deleteFilesFromSupabase(fileNames) {
  if (!fileNames.length || !SUPABASE_URL || !SERVICE_KEY) return;
  const res = await fetch(SUPABASE_URL + "/storage/v1/object/" + BUCKET, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: fileNames }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn("  [Storage] Delete error: " + text);
  } else {
    console.log("  [Storage] Deleted " + fileNames.length + " file(s) from Supabase.");
  }
}

/**
 * Call the production /api/revalidate endpoint to immediately bust the
 * Next.js data cache for products. This ensures deleted products stop
 * appearing on the storefront without waiting for the 1-hour TTL to expire.
 */
async function revalidateProductCache() {
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myra-phi.vercel.app";
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn("  [Cache] NEXTAUTH_SECRET not set — skipping cache revalidation.");
    console.warn("  [Cache] Run manually: POST " + productionUrl + "/api/revalidate");
    return;
  }
  try {
    const res = await fetch(productionUrl + "/api/revalidate", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags: ["products", "collections", "workerProducts"] }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log("  [Cache] Revalidated tags: " + (data.revalidated || []).join(", "));
    } else {
      const text = await res.text();
      console.warn("  [Cache] Revalidation failed (" + res.status + "): " + text.slice(0, 200));
      console.warn("  [Cache] You may need to redeploy or wait for cache TTL (~1 hour).");
    }
  } catch (err) {
    console.warn("  [Cache] Could not reach revalidation endpoint: " + err.message);
  }
}

async function main() {
  console.log("=== Purge Unbought Products ===\n");

  // Products with no order items at all
  const unbought = await prisma.product.findMany({
    where: { orderItems: { none: {} } },
    select: { id: true, name: true, code: true, images: true, videoUrl: true },
  });

  if (unbought.length === 0) {
    console.log("No unbought products found. Nothing to delete.");
    return;
  }

  console.log("Found " + unbought.length + " product(s) with no orders:\n");
  for (const p of unbought) {
    console.log("  [" + (p.code || "no-code") + "] " + p.name + " (" + p.images.length + " image(s))");
  }

  // Collect storage file names
  const allFileNames = [];
  for (const p of unbought) {
    for (const img of p.images) {
      const fn = extractFileName(img);
      if (fn) allFileNames.push(fn);
    }
    if (p.videoUrl) {
      const fn = extractFileName(p.videoUrl);
      if (fn) allFileNames.push(fn);
    }
  }

  console.log("\nTotal storage files to delete: " + allFileNames.length);

  if (allFileNames.length > 0) {
    console.log("Deleting images from Supabase Storage...");
    await deleteFilesFromSupabase(allFileNames);
  }

  console.log("Deleting products from database...");
  const ids = unbought.map((p) => p.id);
  const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log("\nDone! Permanently deleted " + result.count + " product(s) from the database.");

  // Immediately bust the Next.js cache so deleted products vanish from the site
  console.log("\nClearing storefront cache...");
  await revalidateProductCache();

  console.log("\nAll done! Products are deleted from DB, images removed from Supabase,");
  console.log("and the storefront cache has been cleared.");
}

main()
  .catch((err) => { console.error("Error:", err); process.exit(1); })
  .finally(() => { prisma.$disconnect(); pool.end(); });
