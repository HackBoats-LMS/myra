import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { unstable_cache } from 'next/cache';
import Pagination from '@/components/storefront/Pagination';
import ProductListTable from '@/components/admin/ProductListTable';
import AdminFilters from '@/components/admin/AdminFilters';

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
      prisma.collection.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
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
  let collections: { id: string; name: string }[] = [];

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
    console.warn("Database unreachable in AdminProductsPage:", error);
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const baseUrl =
    (archived ? '/admin/products?view=archived' : '/admin/products') +
    (search ? `&search=${encodeURIComponent(search)}` : '') +
    (collection ? `&collection=${encodeURIComponent(collection)}` : '');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">
            {archived ? 'Archived Products' : 'Products'}
          </h2>
          <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Manage your storefront inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={archived ? '/admin/products' : '/admin/products?view=archived'}
            className="border border-[#B6925B]/30 hover:bg-[#FAFAFA] text-[#4A3B2C] px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors rounded-none"
          >
            <i className={archived ? "ri-archive-drawer-line text-sm" : "ri-archive-line text-sm"} />
            {archived ? 'Active Products' : 'Archived'}
          </Link>
          {!archived && (
            <Link href="/admin/products/new" className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none">
              <i className="ri-plus-line text-sm" />
              Add Product
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
        statusOptions={collections.map((c) => ({ value: c.id, label: c.name }))}
      />

      <ProductListTable products={products} archived={archived} />

      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
