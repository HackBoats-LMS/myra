import { prisma } from "@/lib/prisma";
import { getAllCollections } from "@/services/collections";
import ProductForm from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) {
    notFound();
  }

  const collections = await getAllCollections();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Product</h2>
        <p className="text-sm text-gray-500 mt-1">Update details for {product.name}</p>
      </div>
      
      <ProductForm collections={collections} initialData={product} />
    </div>
  );
}
