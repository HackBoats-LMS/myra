import AddToCartButton from "@/components/shared/AddToCartButton";
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
  const specifications: Array<{label: string, value: string}> = [];
  if (product.productType) {
    specifications.push({ label: "Product Type", value: product.productType });
  }

  let attributesObj: Record<string, string> = {};
  if (product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)) {
    attributesObj = product.attributes as Record<string, string>;
  }

  // Push the dynamic attributes or fallback to old fields
  if (Object.keys(attributesObj).length === 0) {
    if (product.material) specifications.push({ label: "Material / Fabric", value: product.material });
    if (product.weight) specifications.push({ label: "Weight", value: product.weight });
  } else {
    for (const [key, value] of Object.entries(attributesObj)) {
      if (value && String(value).trim() !== "") {
        specifications.push({ label: key, value: String(value) });
      }
    }
  }

  return (
    <div className="flex flex-col pt-1 sm:pt-2 w-full max-w-xl">
      {/* Product Title */}
      <h1 className="text-xl sm:text-2xl lg:text-[26px] font-serif text-[#171717] leading-snug tracking-normal mb-5">
        {product.name}
      </h1>

      {/* Sizes, Quantity, Price, and Action Buttons (Add To Cart & Buy) */}
      <AddToCartButton 
        productId={product.id} 
        outOfStock={product.stockQuantity <= 0} 
        variants={product.variants}
        displayPrice={displayPrice}
        displayOriginal={displayOriginal}
        flashPercent={flashPercent}
      />

      {product.stockQuantity <= 0 && (
        <div className="mt-3">
          <StockNotifyButton productId={product.id} />
        </div>
      )}

      {/* Product Specifications List */}
      <div className="space-y-1.5 pt-7 text-xs sm:text-[13px] text-[#171717] leading-relaxed">
        {specifications.map((spec, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold">{spec.label}:</span>
            <span className="text-gray-800">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Shipping Section */}
      <div className="pt-6">
        <h3 className="text-sm sm:text-base font-serif font-semibold text-[#171717] mb-2.5">
          Shipping:
        </h3>
        <PincodeChecker />
      </div>
    </div>
  );
}

