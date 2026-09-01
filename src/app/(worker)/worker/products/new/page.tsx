import ProductForm from "@/components/shared/ProductForm";
import { getAllCollections } from "@/services/collections";
import { requireWorkerModule } from "@/lib/worker";

export const dynamic = "force-dynamic";

export default async function NewWorkerProductPage() {
  await requireWorkerModule("inventory");
  const collections = await getAllCollections();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Add New Product</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Upload images and set inventory details.</p>
      </div>

      <ProductForm collections={collections} />
    </div>
  );
}
