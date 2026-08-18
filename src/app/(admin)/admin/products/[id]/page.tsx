import { prisma } from "@/lib/db/prisma";
import { getAllCollections } from "@/services/collections";
import ProductForm from "@/components/shared/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  });

  if (!product) {
    notFound();
  }

  const collections = await getAllCollections();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Edit Product</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Update details for {product.name}</p>
      </div>
      
      <ProductForm collections={collections} initialData={product} />
    </div>
  );
}
