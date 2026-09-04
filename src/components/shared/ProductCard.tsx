import Image from 'next/image';
import Link from 'next/link';
import WishlistButton from './WishlistToggle';

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
  // Calculate discount percentage if original price is higher
  const discountPercent = product.flashPercent || (
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null
  );

  const displayImage = product.images?.find(
    img => img && img.trim() !== '' && !img.toLowerCase().endsWith('.mp4') && !img.toLowerCase().includes('.mp4')
  );

  return (
    <div className="group flex flex-col relative w-full">
      {/* Image Container with Top-Right Wishlist Button */}
      <div className="relative aspect-[3/4] w-full bg-[#F7F7F7] overflow-hidden">
        <Link href={`/products/${product.slug}`} className="relative block w-full h-full">
          {product.stockQuantity === 0 && (
            <span className="absolute top-2 left-2 z-10 bg-[#2D1F2F]/90 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest">
              Out of Stock
            </span>
          )}
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              quality={100}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#FAF0F0]">
              <i className="ri-image-line text-3xl text-[#7A0B2E]/30" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A0B2E]/40 text-center px-2 line-clamp-2">
                {product.name}
              </span>
            </div>
          )}
        </Link>

        {/* Top-Right Wishlist Heart Button */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <WishlistButton
            productId={product.id}
            isWishlisted={isWishlisted}
            className="flex items-center justify-center text-gray-700 hover:text-black transition-transform hover:scale-110 p-1"
            iconClassName="ri-heart-3-line text-xl leading-none text-gray-700 hover:text-black"
          />
        </div>
      </div>

      {/* Product Details Below Image */}
      <Link href={`/products/${product.slug}`} className="flex flex-col mt-2.5 group-hover:opacity-95">
        <h3 className="text-sm md:text-base font-serif text-[#4A4A4A] group-hover:text-[#7A0B2E] transition-colors line-clamp-1">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-sm md:text-base font-bold text-[#2D1F2F]">
            &#8377;{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice != null && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through font-normal">
              &#8377;{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {discountPercent != null && discountPercent > 0 && (
            <span className="text-xs font-semibold text-[#16A34A]">
              {discountPercent}%
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
