"use client";
import { useEffect, useState } from "react";
import { getProductsByIds } from "@/actions/products";
import ProductCard from "@/components/storefront/ProductCard";
import type { Prisma } from "@/generated/prisma";

type RecentlyViewedProduct = Prisma.ProductGetPayload<{
  include: { collection: true; variants: true };
}>;

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const stored = localStorage.getItem("recently_viewed");
        let ids: string[] = stored ? JSON.parse(stored) : [];

        // If we are on a product page, add it to the tracker
        if (currentProductId) {
          ids = [currentProductId, ...ids.filter((id) => id !== currentProductId)].slice(0, 5);
          localStorage.setItem("recently_viewed", JSON.stringify(ids));
        }

        // We want to fetch the products to display, excluding the current one
        const idsToFetch = currentProductId 
          ? ids.filter((id) => id !== currentProductId).slice(0, 4)
          : ids.slice(0, 4);

        if (idsToFetch.length > 0) {
          const fetched = await getProductsByIds(idsToFetch);
          setProducts(fetched);
        }
      } catch (err) {
        console.error("Failed to load recently viewed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecent();
  }, [currentProductId]);

  if (isLoading || products.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 border-t border-[#B6925B]/20 pt-16">
      <h2 className="text-2xl font-serif text-[#4A3B2C] tracking-wide mb-10 text-center">
        Recently Viewed
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
