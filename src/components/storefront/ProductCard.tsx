import Image from 'next/image';
import Link from 'next/link';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product, isWishlisted = false }: { product: any, isWishlisted?: boolean }) {
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-3 relative">
      <WishlistButton productId={product.id} isWishlisted={isWishlisted} />
      
      <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] overflow-hidden rounded-md">
        {product.images?.[0] ? (
          <Image 
            src={product.images[0]} 
            alt={product.name} 
            fill 
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
        )}
      </div>
      <div className="flex flex-col space-y-1">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">{product.name}</h3>
        <p className="text-sm text-gray-500">₹{product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
