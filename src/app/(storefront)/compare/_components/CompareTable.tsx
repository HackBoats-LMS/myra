import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/shared/AddToCartButton";
import CompareButton from "@/components/shared/CompareButton";

interface ReviewEntry {
  rating: number;
}

interface ProductCompareEntry {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  productType: string | null;
  material: string | null;
  code: string | null;
  stockQuantity: number;
  images: string[];
  reviews: ReviewEntry[];
  variants: Array<{ id: string; size: string | null; color: string | null }>;
}

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
    <tr className={`border-b border-[#7A0B2E]/10 ${highlight ? "bg-[#F5EFE6]" : "bg-white"}`}>
      <td className="py-4 px-5 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] w-40 align-middle whitespace-nowrap border-r border-[#7A0B2E]/10">
        {label}
      </td>
      {values.map((value, i) => (
        <td key={i} className="py-4 px-6 text-sm text-[#2D1F2F] text-center align-middle font-medium">
          {value}
        </td>
      ))}
    </tr>
  );
}

interface CompareTableProps {
  ordered: ProductCompareEntry[];
  priced: ProductCompareEntry[];
}

export default function CompareTable({ ordered, priced }: CompareTableProps) {
  const rows = [
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
        const avg = (p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / n).toFixed(1);
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
    <div className="overflow-x-auto bg-white border border-[#7A0B2E]/20 shadow-sm">
      <table className="w-full border-collapse" style={{ minWidth: `${Math.max(540, 200 * ordered.length + 160)}px` }}>
        <thead>
          <tr className="border-b-2 border-[#7A0B2E]/20">
            <th className="w-40 p-5 border-r border-[#7A0B2E]/10 bg-[#F5EFE6] align-bottom">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Attributes
              </span>
            </th>

            {priced.map((p) => {
              const avgRating =
                p.reviews.length > 0
                  ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length
                  : null;
              const savings =
                (p as { flashPercent?: number }).flashPercent === undefined &&
                p.originalPrice && p.originalPrice > p.price
                  ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                  : null;

              return (
                <th key={p.id} className="p-5 align-top text-left border-r last:border-r-0 border-[#7A0B2E]/10">
                  <div className="flex flex-col gap-4">
                    <Link href={`/products/${p.slug}`} className="group block">
                      <div className="relative aspect-[3/4] w-full max-w-[180px] mx-auto overflow-hidden bg-[#F5EFE6] border border-[#7A0B2E]/20">
                        {savings && (
                          <div className="absolute top-2 left-2 z-10 bg-[#7A0B2E] text-white text-[9px] font-black px-2 py-1 uppercase tracking-wider">
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

                    <div>
                      <Link href={`/products/${p.slug}`} className="hover:text-[#7A0B2E] transition-colors">
                        <h3 className="text-sm font-bold text-[#2D1F2F] line-clamp-2 leading-snug">
                          {p.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-base font-black text-[#2D1F2F]">
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
                              className={`ri-star-${star <= Math.round(avgRating) ? "fill" : "line"} text-xs text-[#7A0B2E]`}
                            />
                          ))}
                          <span className="text-[10px] text-gray-500 font-bold ml-0.5">
                            ({p.reviews.length})
                          </span>
                        </div>
                      )}
                    </div>

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
  );
}
