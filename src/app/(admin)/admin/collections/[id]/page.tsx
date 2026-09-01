import { prisma } from "@/lib/db/prisma";
import CollectionForm from "@/components/shared/CollectionForm";
import CollectionBestSellers from "@/components/shared/CollectionBestSellers";
import { notFound } from "next/navigation";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [collection, parentCollections, products] = await Promise.all([
    prisma.collection.findUnique({
      where: { id }
    }),
    prisma.collection.findMany({
      where: { parentId: null, id: { not: id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.product.findMany({
      where: { collectionId: id, deletedAt: null },
      select: { id: true, name: true, images: true, bestSeller: true },
      orderBy: { name: "asc" },
    })
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Edit Category</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Update details for {collection.name}</p>
      </div>
      
      <CollectionForm 
        initialData={collection} 
        parentCollections={parentCollections}
      />

      <CollectionBestSellers products={products} basePath="/admin/products" />
    </div>
  );
}

