import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getProducts } from "@/services/products";
import Pagination from "@/components/storefront/Pagination";
import { prisma } from "@/lib/prisma";
import ProductListTable from "@/components/admin/ProductListTable";
import { requireWorkerModule } from "@/lib/worker";
import { CACHE_TAGS } from "@/lib/cache";

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
    console.warn("Database unreachable in WorkerProductsPage:", error);
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const baseUrl = "/worker/products";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Inventory</h2>
          <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Manage storefront products and stock</p>
        </div>
        <Link href="/worker/products/new" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none">
          <i className="ri-plus-line text-sm" />
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