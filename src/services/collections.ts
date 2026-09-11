import { getCachedAllCollections } from "@/lib/cache";
import { prisma } from "@/lib/db/prisma";

export async function getAllCollections() {
  return getCachedAllCollections();
}

export async function getHierarchyParentOptions(excludeId?: string): Promise<{ id: string; name: string }[]> {
  try {
    const rawParents = await prisma.collection.findMany({
      where: { 
        parentId: null,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      include: {
        children: {
          where: excludeId ? { id: { not: excludeId } } : {},
          orderBy: [{ order: "asc" }, { name: "asc" }]
        }
      },
      orderBy: [{ order: "asc" }, { name: "asc" }]
    });

    const flattened: { id: string; name: string }[] = [];
    for (const parent of rawParents) {
      flattened.push({ id: parent.id, name: `${parent.name} (Department)` });
      for (const section of parent.children) {
        flattened.push({ id: section.id, name: `  ↳ ${parent.name} / ${section.name} (Section)` });
      }
    }
    return flattened;
  } catch (error) {
    console.warn("Failed to load hierarchical parent options:", error);
    return [];
  }
}
