import ProductForm from "@/components/admin/ProductForm";
import { getAllCollections } from "@/services/collections";

export default async function NewProductPage() {
  const collections = await getAllCollections();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Add New Product</h2>
        <p className="text-sm text-gray-500 mt-1">Upload images and set inventory details.</p>
      </div>
      
      <ProductForm collections={collections} />
    </div>
  );
}
