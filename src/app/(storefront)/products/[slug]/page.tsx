import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "@/components/storefront/AddToCartButton";

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      collection: true
    }
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 md:py-20 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Image Gallery (Simplified for now) */}
        <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] overflow-hidden">
          {product.images?.[0] ? (
            <Image 
              src={product.images[0]} 
              alt={product.name} 
              fill 
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col pt-8 md:pt-12">
          {product.collection && (
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{product.collection.name}</span>
          )}
          <h1 className="text-3xl md:text-5xl font-serif text-gray-900 tracking-tight mb-4">{product.name}</h1>
          <p className="text-2xl text-gray-900 mb-8">₹{product.price.toFixed(2)}</p>
          
          <div className="prose prose-sm text-gray-600 mb-12">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto space-y-4">
            <AddToCartButton productId={product.id} outOfStock={product.stockQuantity <= 0} />
            <div className="text-xs text-center text-gray-500 uppercase tracking-widest">
              Complimentary shipping and returns
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
