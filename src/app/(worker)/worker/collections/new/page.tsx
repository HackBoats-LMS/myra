import CollectionForm from "@/components/shared/CollectionForm";
import { requireWorkerModule } from "@/lib/worker";
import { prisma } from "@/lib/db/prisma";

export default async function NewWorkerCollectionPage({
  searchParams
}: {
  searchParams?: Promise<{ parentId?: string }>;
}) {
  await requireWorkerModule("inventory");
  const resolvedParams = searchParams ? await searchParams : undefined;
  const parentId = resolvedParams?.parentId;

  let parentCollections: { id: string; name: string }[] = [];
  try {
    parentCollections = await prisma.collection.findMany({
      where: { parentId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.warn("Database unreachable in NewWorkerCollectionPage:", error);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-[#7A0B2E]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">
          {parentId ? "Add New Subcategory" : "Add New Category"}
        </h2>
        <p className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">
          {parentId ? "Create a subcategory under the parent category." : "Create a new category to organize your products."}
        </p>
      </div>

      <CollectionForm 
        parentCollections={parentCollections} 
        defaultParentId={parentId} 
      />
    </div>
  );
}
