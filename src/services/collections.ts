import { getCachedAllCollections } from "@/lib/cache";

export async function getAllCollections() {
  return getCachedAllCollections();
}
