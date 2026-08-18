"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { COMPARE_COOKIE, COMPARE_MAX } from "@/lib/compare";
import { getActiveFlashSales, applyFlashDiscount } from "@/features/flash-sale/lib";

export async function getCompareState(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COMPARE_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

async function writeCompare(ids: string[]) {
  const cookieStore = await cookies();
  cookieStore.set(COMPARE_COOKIE, JSON.stringify(ids), {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function toggleCompare(productId: string): Promise<string[]> {
  const current = await getCompareState();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId].slice(-COMPARE_MAX);
  await writeCompare(next);
  return next;
}

export async function clearCompare(): Promise<string[]> {
  await writeCompare([]);
  return [];
}

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  originalPrice: number | null;
  flashPercent?: number;
}

export async function getCompareProducts(ids: string[]): Promise<CompareProduct[]> {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true, slug: true, images: true, price: true, originalPrice: true, collectionId: true },
  });
  const sales = await getActiveFlashSales();
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => {
      const flash = applyFlashDiscount(p.price, p.originalPrice, sales, p.collectionId);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0] ?? null,
        price: flash.price,
        originalPrice: flash.discounted ? flash.originalPrice : p.originalPrice,
        flashPercent: flash.discounted ? flash.percent : undefined,
      };
    });
}