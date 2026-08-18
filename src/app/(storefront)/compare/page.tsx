import { prisma } from "@/lib/prisma";
import { getCompareIds } from "@/lib/compare";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import CompareButton from "@/components/storefront/CompareButton";
import { Metadata } from "next";
import { getActiveFlashSales, applyFlashToProductList } from "@/lib/flash-sale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Products | Myra Shopping Mall",
  description: "Compare products side by side to make the best choice.",
};

// ── Row config ───────────────────────────────────────────────────────────────
function AttributeRow({
  label,
  values,
  highlight,
}: {
  label: string;
  values: (string | number)[];
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-[#B6925B]/10 ${highlight ? "bg-[#FAFAFA]" : "bg-white"}`}>
      <td className="py-4 px-5 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] w-40 align-middle whitespace-nowrap border-r border-[#B6925B]/10">
        {label}
      </td>
      {values.map((value, i) => (
        <td key={i} className="py-4 px-6 text-sm text-[#4A3B2C] text-center align-middle font-medium">
          {value}
        </td>
      ))}
    </tr>
  );
}

export default async function ComparePage() {
  const ids = await getCompareIds();

  const EmptyState = () => (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-32 text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-[#FAFAFA] border border-[#B6925B]/20 flex items-center justify-center">
        <i className="ri-arrow-left-right-line text-4xl text-[#B6925B]" />
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-serif text-[#4A3B2C] tracking-wide">Nothing to Compare</h1>
        <p className="text-gray-500 text-sm mt-2">Add a couple of products to compare them side by side.</p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors"
      >
        <i className="ri-store-2-line" />
        Browse Products
      </Link>
    </div>
  );

  if (ids.length === 0) return <EmptyState />;

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: {
      reviews: { select: { rating: true } },
      variants: true,
    },
  });

  if (products.length === 0) return <EmptyState />;

  const ordered = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const flashSales = await getActiveFlashSales();
  const priced = applyFlashToProductList(ordered, flashSales);

  const rows: { label: string; values: (string | number)[]; highlight?: boolean }[] = [
    {
      label: "Price",
      values: priced.map((p) => `₹${p.price.toLocaleString("en-IN")}`),
      highlight: true,
    },
    {
      label: "MRP",
      values: priced.map((p) =>
        p.originalPrice && p.originalPrice > p.price
          ? `₹${p.originalPrice.toLocaleString("en-IN")}`
          : "—"
      ),
    },
    {
      label: "Rating",
      values: ordered.map((p) => {
        const n = p.reviews.length;
        if (n === 0) return "No reviews yet";
        const avg = (p.reviews.reduce((s, r) => s + r.rating, 0) / n).toFixed(1);
        return `★ ${avg} (${n})`;
      }),
      highlight: true,
    },
    { label: "Product Type", values: ordered.map((p) => p.productType || "—") },
    { label: "Material", values: ordered.map((p) => p.material || "—"), highlight: true },
    { label: "Product Code", values: ordered.map((p) => p.code || "—") },
    {
      label: "Availability",
      values: ordered.map((p) =>
        p.stockQuantity > 0 ? "✓ In Stock" : "✗ Out of Stock"
      ),
      highlight: true,
    },
  ];

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">

        {/* Page header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B] mb-1 flex items-center gap-1.5">
              <i className="ri-arrow-left-right-line" />
              Side by Side
            </p>
            <h1 className="text-2xl md:text-3xl font-serif text-[#4A3B2C] tracking-wide">Compare Products</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors border border-[#B6925B]/30 px-4 py-2 hover:bg-white"
          >
            <i className="ri-store-2-line" />
            <span className="hidden sm:inline">Continue Shopping</span>
          </Link>
        </div>

        {/* Compare table */}
        <div className="overflow-x-auto bg-white border border-[#B6925B]/20 shadow-sm">
          <table className="w-full border-collapse" style={{ minWidth: `${Math.max(540, 200 * ordered.length + 160)}px` }}>

            {/* Product cards header row */}
            <thead>
              <tr className="border-b-2 border-[#B6925B]/20">
                {/* Label column */}
                <th className="w-40 p-5 border-r border-[#B6925B]/10 bg-[#FAFAFA] align-bottom">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Attributes
                  </span>
                </th>

                {/* Product columns */}
                {priced.map((p) => {
                  const avgRating =
                    p.reviews.length > 0
                      ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
                      : null;
                  const savings =
                    (p as { flashPercent?: number }).flashPercent === undefined &&
                    p.originalPrice && p.originalPrice > p.price
                      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                      : null;

                  return (
                    <th key={p.id} className="p-5 align-top text-left border-r last:border-r-0 border-[#B6925B]/10">
                      <div className="flex flex-col gap-4">
                        {/* Product image */}
                        <Link href={`/products/${p.slug}`} className="group block">
                          <div className="relative aspect-[3/4] w-full max-w-[180px] mx-auto overflow-hidden bg-[#FAFAFA] border border-[#B6925B]/20">
                            {savings && (
                              <div className="absolute top-2 left-2 z-10 bg-[#B6925B] text-white text-[9px] font-black px-2 py-1 uppercase tracking-wider">
                                -{savings}%
                              </div>
                            )}
                            {p.images[0] ? (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                quality={90}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold uppercase tracking-widest">
                                No Image
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Product name & price */}
                        <div>
                          <Link href={`/products/${p.slug}`} className="hover:text-[#B6925B] transition-colors">
                            <h3 className="text-sm font-bold text-[#4A3B2C] line-clamp-2 leading-snug">
                              {p.name}
                            </h3>
                          </Link>
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-base font-black text-[#4A3B2C]">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{p.originalPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          {avgRating && (
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                  key={star}
                                  className={`ri-star-${star <= Math.round(avgRating) ? "fill" : "line"} text-xs text-[#B6925B]`}
                                />
                              ))}
                              <span className="text-[10px] text-gray-500 font-bold ml-0.5">
                                ({p.reviews.length})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CTA buttons */}
                        <div className="flex flex-col gap-2">
                          <AddToCartButton
                            productId={p.id}
                            outOfStock={p.stockQuantity <= 0}
                            variants={p.variants}
                          />
                          <CompareButton productId={p.id} variant="pill" />
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Attribute rows */}
            <tbody>
              {rows.map((row) => (
                <AttributeRow
                  key={row.label}
                  label={row.label}
                  values={row.values}
                  highlight={row.highlight}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
          <p>Showing {ordered.length} product{ordered.length !== 1 ? "s" : ""} in comparison</p>
          <Link href="/" className="text-[#B6925B] hover:text-[#4A3B2C] font-bold uppercase tracking-widest transition-colors text-[10px]">
            + Add more products
          </Link>
        </div>

      </div>
    </div>
  );
}