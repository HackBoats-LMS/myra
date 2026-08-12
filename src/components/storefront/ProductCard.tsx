import Image from 'next/image';
import Link from 'next/link';
import WishlistButton from './WishlistButton';
import StarRating from './StarRating';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    images: string[];
    reviewCount?: number;
    averageRating?: number;
  };
  isWishlisted?: boolean;
}

export default function ProductCard({ 
  product, 
  isWishlisted = false 
}: ProductCardProps) {
  const reviewCount = product.reviewCount || 0;
  const averageRating = product.averageRating || 0;

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-3 relative">
      <WishlistButton productId={product.id} isWishlisted={isWishlisted} />
      
      <div className="relative aspect-[3/4] w-full bg-[#FAFAFA] overflow-hidden rounded-none border border-[#B6925B]/10">
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
      <div className="flex flex-col space-y-1 mt-2">
        <h3 className="text-sm font-bold text-[#4A3B2C] group-hover:text-[#B6925B] transition-colors line-clamp-1">{product.name}</h3>
        
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 py-0.5">
            <StarRating rating={averageRating} sizeClassName="text-[10px] text-[#B6925B]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">({reviewCount})</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm font-bold text-[#4A3B2C]">&#8377;{product.price.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </Link>
  );
}