import ProductForm from "@/components/shared/ProductForm";
import { getAllCollections } from "@/services/collections";
import { requireWorkerModule } from "@/lib/worker";

export const dynamic = "force-dynamic";

export default async function NewWorkerProductPage() {
  await requireWorkerModule("inventory");
  const collections = await getAllCollections();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-[#7A0B2E]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Add New Product</h2>
        <p className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">Upload images and set inventory details.</p>
      </div>

      <ProductForm collections={collections} />
    </div>
  );
}
