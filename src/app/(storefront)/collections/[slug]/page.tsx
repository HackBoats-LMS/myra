import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/storefront/ProductCard";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight capitalize">{collection.name}</h1>
        {collection.description && (
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">{collection.description}</p>
        )}
      </div>

      {collection.products.length === 0 ? (
        <div className="text-center text-gray-500 py-20">No products available in this collection.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {collection.products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
