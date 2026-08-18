import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { notFound, redirect } from "next/navigation";
import OrderTrackingTimeline from "@/components/shared/OrderTrackingTimeline";
import OrderHeader from "@/app/(storefront)/account/orders/_components/OrderHeader";
import OrderItemsList from "@/app/(storefront)/account/orders/_components/OrderItemsList";
import OrderStatus from "@/app/(storefront)/account/orders/_components/OrderStatus";
import OrderPaymentAlert from "@/app/(storefront)/account/orders/_components/OrderPaymentAlert";
import OrderAddress from "@/app/(storefront)/account/orders/_components/OrderAddress";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Myra Shopping Mall",
};

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      orderItems: {
        include: {
          product: true,
          returnRequests: true,
        },
      },
    },
  });

  if (!order || order.userId !== userId) {
    notFound();
  }

  const savedAddresses = await prisma.address.findMany({
    where: { userId },
    select: {
      id: true,
      label: true,
      addressLine1: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const canChangeAddress = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  const needsPayment =
    order.paymentMethod === "RAZORPAY" &&
    order.paymentStatus === "UNPAID" &&
    order.status !== "CANCELLED";

  const productIds = order.orderItems.map((item) => item.productId);
  const userReviews = await prisma.review.findMany({
    where: { userId, productId: { in: productIds } },
    select: { productId: true, rating: true, comment: true },
  });
  const reviewByProduct = new Map(userReviews.map((r) => [r.productId, r]));

  const canReview = order.status === "DELIVERED";

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-16 min-h-screen space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide storefront header, mobile menus, footers, buttons */
          nav, header, footer, .print\\:hidden, button, select, a {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .shadow-sm, .border {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />

      <OrderHeader 
        orderId={order.id} 
        createdAt={order.createdAt} 
        status={order.status} 
        canChangeAddress={canChangeAddress} 
        savedAddresses={savedAddresses} 
      />

      {/* Tracking Timeline */}
      <OrderTrackingTimeline status={order.status} order={order} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <OrderItemsList 
          orderItems={order.orderItems} 
          status={order.status} 
          canReview={canReview} 
          reviewByProduct={reviewByProduct} 
          totalAmount={order.totalAmount} 
        />

        {/* Right Column: Status & Shipping */}
        <div className="space-y-6">
          {/* Order Info */}
          <OrderStatus 
            orderId={order.id} 
            status={order.status} 
            paymentMethod={order.paymentMethod} 
            paymentStatus={order.paymentStatus} 
            awbNumber={order.awbNumber} 
            trackingUrl={order.trackingUrl} 
          />

          {/* Payment */}
          {needsPayment && (
            <OrderPaymentAlert orderId={order.id} totalAmount={order.totalAmount} />
          )}

          {/* Delivery Address */}
          <OrderAddress user={order.user} address={order.address} />
        </div>
      </div>
    </div>
  );
}
