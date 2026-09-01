import Link from "next/link";
import Image from "next/image";
import OrderItemReview from "./OrderItemReview";
import OrderItemReturn from "./OrderItemReturn";
import type { Prisma } from "@/generated/prisma";
import { Package } from "lucide-react";

type OrderItemWithProduct = Prisma.OrderItemGetPayload<{
  include: { product: true; returnRequests: true };
}>;

interface OrderItemsListProps {
  orderItems: OrderItemWithProduct[];
  status: string;
  canReview: boolean;
  reviewByProduct: Map<string, any>;
  totalAmount: number;
}

export default function OrderItemsList({ orderItems, status, canReview, reviewByProduct, totalAmount }: OrderItemsListProps) {
  const totalItemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white border border-[#B6925B]/20 overflow-hidden shadow-sm h-fit">
      <div className="p-4 sm:p-6 border-b border-[#B6925B]/20 bg-[#FAFAFA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#B6925B]" />
          <h3 className="font-serif text-[#4A3B2C] text-base sm:text-lg tracking-wide">
            Items in Order
          </h3>
        </div>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="divide-y divide-[#B6925B]/10">
        {orderItems.map((item) => (
          <div key={item.id} className="p-4 sm:p-6 space-y-4">
            <div className="flex items-start sm:items-center gap-4">
              <Link
                href={`/products/${item.product.slug}`}
                className="relative w-16 sm:w-20 aspect-[3/4] bg-[#FAFAFA] overflow-hidden flex-shrink-0 border border-[#B6925B]/20 hover:opacity-90 transition-opacity"
              >
                {item.product.images[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="hover:text-[#B6925B] transition-colors">
                  <h4 className="font-serif font-bold text-[#4A3B2C] text-sm sm:text-base leading-snug line-clamp-2">
                    {item.product.name}
                  </h4>
                </Link>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    Qty: <span className="text-[#4A3B2C]">{item.quantity}</span>
                  </span>
                  {item.product.sku && (
                    <span className="text-[9px] font-mono font-bold text-[#B6925B] uppercase tracking-wider bg-[#FAFAFA] border border-[#B6925B]/20 px-1.5 py-0.5">
                      {item.product.sku}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm sm:text-base font-bold text-[#4A3B2C] flex-shrink-0 text-right">
                ₹{(item.price * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            {canReview && (
              <OrderItemReview
                productId={item.productId}
                productName={item.product.name}
                existingReview={reviewByProduct.get(item.productId) || null}
              />
            )}

            <OrderItemReturn
              orderItemId={item.id}
              productName={item.product.name}
              orderStatus={status}
              existingRequests={item.returnRequests}
            />
          </div>
        ))}
      </div>

      <div className="bg-[#FAFAFA] p-4 sm:p-6 flex justify-between items-center border-t border-[#B6925B]/20">
        <div>
          <span className="block font-bold text-[#4A3B2C] text-[10px] sm:text-xs uppercase tracking-widest">
            Total Paid
          </span>
          <span className="text-[10px] text-gray-400 font-medium">All taxes & fees included</span>
        </div>
        <span className="text-xl sm:text-2xl font-serif text-[#4A3B2C] font-bold">
          ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

