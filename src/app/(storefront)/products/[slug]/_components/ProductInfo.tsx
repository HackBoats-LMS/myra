import AddToCartButton from "@/components/shared/AddToCartButton";
import ShareProductButton from "@/components/shared/ShareProductButton";
import CompareButton from "@/components/shared/CompareButton";
import PincodeChecker from "@/app/(storefront)/products/[slug]/_components/PincodeChecker";
import StockNotifyButton from "@/components/shared/StockNotifyButton";
import type { Prisma } from "@/generated/prisma";

type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

interface ProductInfoProps {
  product: ProductWithVariants;
  displayPrice: number;
  displayOriginal: number | null;
  flashPercent: number | null;
}

export default function ProductInfo({ product, displayPrice, displayOriginal, flashPercent }: ProductInfoProps) {
  return (
    <div className="flex flex-col pt-2 md:pt-4 lg:sticky lg:top-8 lg:self-start">
      <h1 className="text-2xl md:text-3xl font-serif text-[#4A3B2C] tracking-wide mb-4">
        {product.name}
      </h1>

      {product.productType && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#FAFAFA] border border-[#B6925B]/30 text-[#B6925B]">
            {product.productType}
          </span>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <p className="text-sm text-gray-600 leading-relaxed mb-8 break-words">
          {product.description}
        </p>
      )}

      {/* Price Block */}
      <div className="flex items-center gap-3 mb-4">
        {flashPercent && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#B6925B] px-2 py-1">
            Flash {flashPercent}% OFF
          </span>
        )}
        {displayOriginal != null && displayOriginal > displayPrice && (
          <span className="text-lg text-gray-400 line-through">₹{displayOriginal.toLocaleString('en-IN')}</span>
        )}
        <span className="text-2xl font-bold text-[#4A3B2C]">₹{displayPrice.toLocaleString('en-IN')}</span>
      </div>

      {/* Product Specifications */}
      <div className="space-y-2.5 pt-6 mb-6">
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Product Code:</span>
          <span className="text-gray-600">{product.code || "—"}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Product Type:</span>
          <span className="text-gray-600">{product.productType || "—"}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Material:</span>
          <span className="text-gray-600">{product.material || "—"}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Weight:</span>
          <span className="text-gray-600">{product.weight || "—"}</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Fabric:</span>
          <span className="text-gray-600">Pure Silk Blend</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Pattern:</span>
          <span className="text-gray-600">Chevron Zigzag with Gotta Patti & Mirror Work</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Bottom Wear:</span>
          <span className="text-gray-600">Matching Orange Palazzo Pants</span>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-3 text-xs break-words">
          <span className="font-bold text-[#4A3B2C]">Dupatta:</span>
          <span className="text-gray-600">Yes</span>
        </div>
      </div>

      <AddToCartButton 
        productId={product.id} 
        outOfStock={product.stockQuantity <= 0} 
        variants={product.variants} 
      />

      {product.stockQuantity <= 0 && (
        <div className="mt-4">
          <StockNotifyButton productId={product.id} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <ShareProductButton name={product.name} />
        <CompareButton productId={product.id} variant="pill" className="flex-1" />
      </div>

      <div className="mt-6 border-t border-[#B6925B]/20 pt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Delivery Pincode</p>
        <PincodeChecker />
      </div>
    </div>
  );
}
