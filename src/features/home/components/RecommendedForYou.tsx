"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/shared/ProductCard";
import type { Prisma } from "@/generated/prisma";

// We'll define a minimal type for the client since we don't have the full Prisma include types here
type RecommendedProduct = Prisma.ProductGetPayload<Record<string, unknown>> & {
  reviewCount: number;
  averageRating: number;
};

export default function RecommendedForYou() {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/recommendations");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecommendations();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-10">
        <div className="h-[1px] w-12 md:w-24 bg-[#7A0B2E]/50"></div>
        <h2 className="text-2xl md:text-3xl font-serif text-[#7A0B2E] tracking-wider">Recommended For You</h2>
        <div className="h-[1px] w-12 md:w-24 bg-[#7A0B2E]/50"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
    </section>
  );
}
