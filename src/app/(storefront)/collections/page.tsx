import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";

export default async function AllProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight">All Products</h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">Explore our entire collection</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No products available at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
