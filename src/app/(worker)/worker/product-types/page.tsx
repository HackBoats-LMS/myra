import { getProductTypes } from "@/services/product-types-server";
import ProductTypeManager from "@/components/shared/ProductTypeManager";
import { requireWorkerModule } from "@/lib/worker";

export const dynamic = "force-dynamic";

export default async function WorkerProductTypesPage() {
  await requireWorkerModule("inventory");
  const productTypes = await getProductTypes();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ProductTypeManager initialTypes={productTypes} basePath="/worker" />
    </div>
  );
}
