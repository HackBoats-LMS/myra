"use client";
import { useState } from "react";
import { toggleBestSeller } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";
import Link from "next/link";

interface ProductOption {
  id: string;
  name: string;
  images: string[];
  bestSeller: boolean;
}

export default function CollectionBestSellers({
  products,
  basePath,
}: {
  products: ProductOption[];
  basePath: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (productId: string, bestSeller: boolean) => {
    setBusy(productId);
    try {
      await toggleBestSeller(productId, bestSeller);
      toast.success(bestSeller ? "Added to Best Sellers!" : "Removed from Best Sellers.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white border border-[#7A0B2E]/20 shadow-sm">
      <div className="p-6 border-b border-[#7A0B2E]/20">
        <h3 className="text-sm font-bold text-[#2D1F2F] uppercase tracking-widest">Best Sellers</h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">
          Select which products in this collection are featured as Best Sellers.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="p-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          No products in this collection yet.
        </p>
      ) : (
        <div className="divide-y divide-[#7A0B2E]/10">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-[#FAFAFA] transition-colors">
              <label className="inline-flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={p.bestSeller}
                  disabled={busy === p.id}
                  onChange={(e) => toggle(p.id, e.target.checked)}
                  className="w-4 h-4 accent-[#7A0B2E]"
                />
                <span className="relative w-10 h-14 bg-[#FAFAFA] border border-[#7A0B2E]/20 overflow-hidden flex-shrink-0">
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
                </span>
                <span className="text-sm font-bold text-[#2D1F2F] truncate">{p.name}</span>
              </label>
              <Link
                href={`${basePath}/${p.id}`}
                className="text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest hover:underline flex-shrink-0"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
