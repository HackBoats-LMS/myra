import HeroGrid from "@/components/storefront/HeroGrid";
import CategoryShowcase from "@/components/storefront/CategoryShowcase";
import ProductCard from "@/components/storefront/ProductCard";
import { prisma } from "@/lib/prisma";

export default async function StorefrontHome() {
  const collections = await prisma.collection.findMany({
    take: 5,
    orderBy: { createdAt: 'asc' }
  });

  const featuredProducts = await prisma.product.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: { reviews: true }
  });

  return (
    <main className="w-full">
      <HeroGrid />
      <CategoryShowcase collections={collections} />
      
      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-8 py-24 border-t border-gray-100">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-serif text-gray-900 tracking-tight">New Arrivals</h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Curated just for you</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
