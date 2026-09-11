import Link from "next/link";
import { unstable_cache } from "next/cache";
import Pagination from "@/components/shared/Pagination";
import { prisma } from "@/lib/db/prisma";
import ProductListTable from "@/components/shared/ProductListTable";
import AdminFilters from "@/app/(admin)/admin/_components/AdminFilters";
import { requireWorkerModule } from "@/lib/worker";
import { CACHE_TAGS } from "@/lib/cache";
import { Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 25;

type ProductWithCollection = Prisma.ProductGetPayload<{ include: { collection: true } }>;

const getCachedWorkerProducts = unstable_cache(
  async (search: string | undefined, collection: string | undefined, skip: number, take: number) => {
    const where = {
      deletedAt: null,
      ...(collection ? { collectionId: collection } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { code: { contains: search, mode: "insensitive" as const } },
              { collection: { is: { name: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };

    const [products, totalProducts, collections] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { collection: true },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prisma.product.count({ where }),
      prisma.collection.findMany({
        select: { id: true, name: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
    ]);

    return { products: products as ProductWithCollection[], totalProducts, collections };
  },
  ["worker", "products", "filtered"],
  { tags: [CACHE_TAGS.workerProducts], revalidate: 30 }
);

export default async function WorkerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; collection?: string }>;
}) {
  await requireWorkerModule("inventory");
  const { page, search, collection } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  let products: ProductWithCollection[] = [];
  let totalProducts = 0;
  let collections: { id: string; name: string }[] = [];

  try {
    const result = await getCachedWorkerProducts(
      search,
      collection,
      (currentPage - 1) * ITEMS_PER_PAGE,
      ITEMS_PER_PAGE
    );
    products = result.products;
    totalProducts = result.totalProducts;
    collections = result.collections;
  } catch (error) {
    console.warn("Database unreachable in WorkerProductsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const urlParams = new URLSearchParams();
  if (search) urlParams.set("search", search);
  if (collection) urlParams.set("collection", collection);
  const qs = urlParams.toString();
  const baseUrl = qs ? `/worker/products?${qs}` : "/worker/products";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#7A0B2E]/15 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">
            Inventory & Products
          </h1>
          <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-1">
            Manage storefront inventory, update stock levels, and assign variants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-gray-500 hidden sm:inline">
            Total: <strong className="text-[#7A0B2E]">{totalProducts}</strong>
          </span>
          <Link
            href="/worker/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0B2E] hover:bg-[#5C0820] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <AdminFilters
        search={search}
        collection={collection}
        placeholder="Search products by name, code or category..."
        collectionOptions={collections.map((c) => ({ value: c.id, label: c.name }))}
        collectionLabel="All Categories"
      />

      {/* Product List Table */}
      <ProductListTable
        products={products}
        basePath="/worker/products"
      />

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  );
}
