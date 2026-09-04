import ProductCard from "@/components/shared/ProductCard";

interface ProductCardProps {
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
}

interface SimilarProductsProps {
  products: ProductCardProps[];
}

export default function SimilarProducts({ products }: SimilarProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#B6925B] tracking-wider">Similar products</h2>
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
