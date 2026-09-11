import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/generated/prisma';
import { unstable_cache } from 'next/cache';
import Pagination from '@/components/shared/Pagination';
import ProductListTable from '@/components/shared/ProductListTable';
import AdminFilters from '@/app/(admin)/admin/_components/AdminFilters';
import { Archive, Plus } from 'lucide-react';

type ProductWithCollection = Prisma.ProductGetPayload<{ include: { collection: true } }>;

export const dynamic = "force-dynamic";

const getCachedAdminProducts = unstable_cache(
  async (archived: boolean, search: string | undefined, collection: string | undefined, skip: number, take: number) => {
    const where = {
      ...(archived ? { deletedAt: { not: null } } : { deletedAt: null }),
      ...(collection ? { collectionId: collection } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { sku: { contains: search, mode: 'insensitive' as const } },
              { collection: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    };
    const [products, totalProducts, collections] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { collection: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
      prisma.collection.findMany({ 
        select: { 
          id: true, 
          name: true,
          parent: {
            select: {
              name: true,
              parent: { select: { name: true } }
            }
          }
        }, 
        orderBy: [{ order: 'asc' }, { name: 'asc' }] 
      }),
    ]);
    return { products: products as ProductWithCollection[], totalProducts, collections };
  },
  ["admin", "products"],
  { revalidate: 30 }
);

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string; search?: string; collection?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));
  const archived = resolvedSearchParams.view === 'archived';
  const search = resolvedSearchParams.search || undefined;
  const collection = resolvedSearchParams.collection || undefined;
  const ITEMS_PER_PAGE = 10;

  let products: ProductWithCollection[] = [];
  let totalProducts = 0;
  let collections: any[] = [];

  try {
    const result = await getCachedAdminProducts(
      archived,
      search,
      collection,
      (currentPage - 1) * ITEMS_PER_PAGE,
      ITEMS_PER_PAGE
    );
    products = result.products;
    totalProducts = result.totalProducts;
    collections = result.collections;
  } catch (error) {
    console.warn("Database unreachable in AdminProductsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const baseUrl = `/admin/products?view=${archived ? 'archived' : 'active'}` +
    (search ? `&search=${encodeURIComponent(search)}` : '') +
    (collection ? `&collection=${encodeURIComponent(collection)}` : '');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#7A0B2E]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Products</h2>
          <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">Manage storefront products, inventory and variations</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products/new" className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none">
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
          {archived ? (
            <Link href="/admin/products" className="border border-[#7A0B2E]/40 text-[#7A0B2E] hover:bg-[#7A0B2E] hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 rounded-none">
              View Active
            </Link>
          ) : (
            <Link href="/admin/products?view=archived" className="border border-gray-300 text-gray-600 hover:bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 rounded-none">
              <Archive className="w-3.5 h-3.5" />
              Archived
            </Link>
          )}
        </div>
      </div>

      <AdminFilters
        search={search}
        status={collection}
        placeholder="Search name, description, SKU or collection..."
        selectName="collection"
        selectLabel="All collections"
        statusOptions={collections.map((c: any) => {
          const parts = [];
          if (c.parent?.parent?.name) parts.push(c.parent.parent.name);
          if (c.parent?.name) parts.push(c.parent.name);
          parts.push(c.name);
          return { value: c.id, label: parts.join(" > ") };
        })}
      />

      <ProductListTable products={products} archived={archived} />

      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
