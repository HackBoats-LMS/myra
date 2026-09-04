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
    select: {
      id: true,
      userId: true,
      status: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      awbNumber: true,
      trackingUrl: true,
      createdAt: true,
      couponCode: true,
      discountAmount: true,
      shippingAmount: true,
      razorpayPaymentId: true,
      user: true,
      address: true,
      orderItems: {
        include: {
          product: true,
          variant: true,
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

  // --- Live Shiprocket Sync ---
  if (order.awbNumber && order.status !== "DELIVERED" && order.status !== "CANCELLED") {
    try {
      const { trackShipment, mapShiprocketStatus } = await import("@/lib/integrations/shiprocket");
      const trackRes = await trackShipment(order.awbNumber);
      // Shiprocket can return status in shipment_track array or directly
      const rawStatus = 
        trackRes.tracking_data?.shipment_track?.[0]?.current_status || 
        (trackRes.tracking_data as Record<string, unknown>)?.current_status;
      const shiprocketStatus = typeof rawStatus === "string" ? rawStatus : undefined;
        
      if (shiprocketStatus) {
        const mapped = mapShiprocketStatus(shiprocketStatus);
        if (mapped) {
          const statusOrder = ["PENDING", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
          const currentRank = statusOrder.indexOf(order.status);
          const incomingRank = statusOrder.indexOf(mapped.status);
          
          if (incomingRank > currentRank) {
            await prisma.order.update({
              where: { id: order.id },
              data: { 
                status: mapped.status as any, 
                [mapped.timestampField]: new Date() 
              }
            });
            // Update local object so UI reflects the new status instantly
            (order as { status: string }).status = mapped.status;
            (order as Record<string, unknown>)[mapped.timestampField] = new Date();
          }
        }
      }
    } catch (err) {
      // Fail gracefully: if Shiprocket API is down, just use DB status
      console.error("Live tracking sync failed:", err);
    }
  }
  // --- End Live Sync ---

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
    <div className="w-full bg-[#FAFAFA] min-h-screen py-6 sm:py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
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
          orderItems={order.orderItems as any}
          createdAt={order.createdAt} 
          status={order.status} 
          canChangeAddress={canChangeAddress} 
          savedAddresses={savedAddresses} 
        />

        {/* Tracking Timeline */}
        <OrderTrackingTimeline status={order.status} order={order} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Left Column: Items */}
          <div className="lg:col-span-2">
            <OrderItemsList 
              orderItems={order.orderItems} 
              status={order.status} 
              canReview={canReview} 
              reviewByProduct={reviewByProduct} 
              totalAmount={order.totalAmount} 
            />
          </div>

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

            {/* Payment Alert if unpaid */}
            {needsPayment && (
              <OrderPaymentAlert orderId={order.id} totalAmount={order.totalAmount} />
            )}

            {/* Delivery Address */}
            <OrderAddress user={order.user} address={order.address} />
          </div>
        </div>
      </div>
    </div>
  );
}
