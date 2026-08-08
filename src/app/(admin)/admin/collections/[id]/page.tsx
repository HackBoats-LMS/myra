import { prisma } from "@/lib/prisma";
import CollectionForm from "@/components/admin/CollectionForm";
import { notFound } from "next/navigation";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const collection = await prisma.collection.findUnique({
    where: { id }
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Collection</h2>
        <p className="text-sm text-gray-500 mt-1">Update details for {collection.name}</p>
      </div>
      
      <CollectionForm initialData={collection} />
    </div>
  );
}
