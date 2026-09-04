"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/shared/ProductCard";
import type { Prisma } from "@/generated/prisma";

type RecentlyViewedProduct = Prisma.ProductGetPayload<{}> & {
  reviewCount: number;
  averageRating: number;
};

export default function RecentlyViewedRail({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentlyViewed() {
      try {
        const res = await fetch("/api/recently-viewed");
        if (res.ok) {
          const data = await res.json();
          // Filter out the current product and take top 4
          const filtered = (data.products || [])
            .filter((p: { id: string }) => p.id !== currentProductId)
            .slice(0, 4);
          setProducts(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch recently viewed products:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecentlyViewed();
  }, [currentProductId]);

  if (loading || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#B6925B] tracking-wider">Recently Viewed</h2>
        <div className="h-[1px] w-12 md:w-24 bg-[#B6925B]/50"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </section>
  );
}