import Link from "next/link";
import Image from "next/image";
import OrderItemReview from "./OrderItemReview";
import OrderItemReturn from "./OrderItemReturn";
import type { Prisma } from "@/generated/prisma";

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
  return (
    <div className="md:col-span-2 bg-white border border-[#B6925B]/20 overflow-hidden shadow-sm h-fit">
      <div className="p-6 border-b border-[#B6925B]/20 bg-[#FAFAFA]">
        <h3 className="font-serif text-[#4A3B2C] text-lg tracking-wide">Items in Order</h3>
      </div>
      <div className="divide-y divide-[#B6925B]/10">
        {orderItems.map((item) => (
          <div key={item.id} className="p-6">
            <div className="flex items-center gap-4">
              <Link href={`/products/${item.product.slug}`} className="relative w-20 h-28 bg-[#FAFAFA] overflow-hidden flex-shrink-0 border border-[#B6925B]/20 hover:opacity-90 transition-opacity">
                {item.product.images[0] && (
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                )}
              </Link>
              <div className="flex-1">
                <Link href={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
                  <h4 className="font-bold text-[#4A3B2C] text-sm">{item.product.name}</h4>
                </Link>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Qty: {item.quantity}</p>
              </div>
              <div className="text-sm font-bold text-[#B6925B]">
                ₹{(item.price * item.quantity).toFixed(2)}
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

      <div className="bg-[#FAFAFA] p-6 flex justify-between items-center border-t border-[#B6925B]/20">
        <span className="font-bold text-[#4A3B2C] text-[10px] uppercase tracking-widest">Total Paid</span>
        <span className="text-xl font-serif text-[#4A3B2C]">₹{totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
