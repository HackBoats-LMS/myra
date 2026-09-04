import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getProducts } from "@/services/products";
import Pagination from "@/components/shared/Pagination";
import { prisma } from "@/lib/db/prisma";
import ProductListTable from "@/components/shared/ProductListTable";
import { requireWorkerModule } from "@/lib/worker";
import { CACHE_TAGS } from "@/lib/cache";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const getCachedWorkerProducts = unstable_cache(
  async (skip: number, take: number) => {
    const [products, totalProducts] = await Promise.all([
      getProducts(skip, take),
      prisma.product.count({ where: { deletedAt: null } }),
    ]);
    return { products, totalProducts };
  },
  ["worker", "products"],
  { tags: [CACHE_TAGS.workerProducts], revalidate: 30 }
);

export default async function WorkerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireWorkerModule("inventory");
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));
  const ITEMS_PER_PAGE = 10;

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let totalProducts = 0;

  try {
    const result = await getCachedWorkerProducts((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    products = result.products;
    totalProducts = result.totalProducts;
  } catch (error) {
    console.warn("Database unreachable in WorkerProductsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const baseUrl = "/worker/products";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Inventory</h2>
          <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">Manage storefront products and stock</p>
        </div>
        <Link href="/worker/products/new" className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <ProductListTable products={products} basePath="/worker/products" />

      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
