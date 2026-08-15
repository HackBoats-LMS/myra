import Link from 'next/link';
import { getProducts } from '@/services/products';
import Pagination from '@/components/storefront/Pagination';
import { prisma } from '@/lib/prisma';
import ProductListTable from '@/components/admin/ProductListTable';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10));
  const archived = resolvedSearchParams.view === 'archived';
  const ITEMS_PER_PAGE = 10;

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let totalProducts = 0;

  try {
    const where = archived ? { deletedAt: { not: null } } : { deletedAt: null };
    const results = await Promise.all([
      archived
        ? prisma.product.findMany({
            where,
            include: { collection: true },
            orderBy: { updatedAt: 'desc' },
            skip: (currentPage - 1) * ITEMS_PER_PAGE,
            take: ITEMS_PER_PAGE,
          })
        : getProducts((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE),
      prisma.product.count({ where })
    ]);
    products = results[0];
    totalProducts = results[1];
  } catch (error) {
    console.warn("Database unreachable in AdminProductsPage:", error);
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));
  const baseUrl = archived ? '/admin/products?view=archived' : '/admin/products';

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

      <ProductListTable products={products} archived={archived} />

      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
