import { prisma } from "@/lib/db/prisma";
import CollectionForm from "@/components/shared/CollectionForm";
import CollectionBestSellers from "@/components/shared/CollectionBestSellers";
import { notFound } from "next/navigation";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const collection = await prisma.collection.findUnique({
    where: { id }
  });

  if (!collection) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { collectionId: id, deletedAt: null },
    select: { id: true, name: true, images: true, bestSeller: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Edit Collection</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Update details for {collection.name}</p>
      </div>
      
      <CollectionForm initialData={collection} />

      <CollectionBestSellers products={products} basePath="/admin/products" />
    </div>
  );
}
