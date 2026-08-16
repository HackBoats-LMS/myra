interface TimelineStep {
  key: string;
  label: string;
  time: string | Date | null;
}

export default function OrderTrackingTimeline({ status, order }: { status: string; order: Record<string, unknown> }) {
  if (status === "CANCELLED") {
    return (
      <div className="bg-red-50 border border-red-200 p-5 space-y-1">
        <span className="inline-flex items-center gap-1.5 text-red-700 text-[10px] font-bold uppercase tracking-widest">
          <i className="ri-close-circle-line text-base" />
          Order Cancelled
        </span>
        {(order.cancelledAt as string) && (
          <p className="text-xs text-red-600">
            Cancelled on {new Date(order.cancelledAt as string).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
          </p>
        )}
      </div>
    );
  }

  const steps: TimelineStep[] = [
    { key: "PENDING", label: "Placed", time: order.createdAt as string },
    { key: "READY_TO_SHIP", label: "Ready to Ship", time: order.readyToShipAt as string | null },
    { key: "SHIPPED", label: "Shipped", time: order.shippedAt as string | null },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", time: order.outForDeliveryAt as string | null },
    { key: "DELIVERED", label: "Delivered", time: order.deliveredAt as string | null },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm">
      <h3 className="font-serif text-[#4A3B2C] text-lg tracking-wide border-b border-[#B6925B]/20 pb-3">
        Order Tracking
      </h3>

      <div className="mt-6">
        <div className="grid grid-cols-5">
          {steps.map((step, i) => {
            const reached = i <= currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center relative">
                {i > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-0.5 -z-0 ${
                      i <= currentIndex ? "bg-[#B6925B]" : "bg-[#B6925B]/20"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold leading-none transition-colors ${
                    reached ? "bg-[#B6925B] border-[#B6925B] text-white" : "bg-white border-[#B6925B]/30 text-gray-400"
                  }`}
                >
                  {reached ? <i className="ri-check-line text-sm leading-none" /> : <span className="leading-none">{i + 1}</span>}
                </div>
                <p className={`mt-2 text-[9px] font-bold uppercase tracking-widest text-center ${
                  reached ? "text-[#4A3B2C]" : "text-gray-400"
                }`}>
                  {step.label}
                </p>
                {step.time && (
                  <p className="mt-0.5 text-[8px] text-gray-400 text-center">
                    {new Date(step.time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
