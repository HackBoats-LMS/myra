import Image from 'next/image';
import Link from 'next/link';
import WishlistButton from './WishlistButton';
import StarRating from './StarRating';
import { CompareButton } from './CompareButton';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    images: string[];
    reviewCount?: number;
    averageRating?: number;
    stockQuantity?: number;
    flashPercent?: number;
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
      {/* Hover-reveal action buttons */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 transition-all duration-200 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
        <WishlistButton productId={product.id} isWishlisted={isWishlisted} />
        <CompareButton productId={product.id} className="top-0 right-0 static" />
      </div>
      
      <div className="relative aspect-[3/4] w-full bg-[#FAFAFA] overflow-hidden rounded-none border border-[#B6925B]/10">
        {product.stockQuantity === 0 && (
          <span className="absolute top-2 left-2 z-10 bg-[#4A3B2C]/90 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-none">
            Out of Stock
          </span>
        )}
        {product.flashPercent ? (
          <span className="absolute top-2 left-2 z-10 bg-[#B6925B] text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-none">
            Flash {product.flashPercent}% OFF
          </span>
        ) : null}
        {product.images?.[0] && product.images[0].trim() !== '' ? (
          <Image 
            src={product.images[0]} 
            alt={product.name} 
            fill 
            quality={100}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#F5F0E8]">
            <i className="ri-image-line text-3xl text-[#B6925B]/30" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#B6925B]/40 text-center px-2 line-clamp-2">
              {product.name}
            </span>
          </div>
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
          <span className="text-sm font-bold text-[#1a1a1a]">&#8377;{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice != null && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">&#8377;{product.originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}