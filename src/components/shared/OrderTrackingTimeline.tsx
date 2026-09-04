import { Check, XCircle } from "lucide-react";

interface TimelineStep {
  key: string;
  label: string;
  time: string | Date | null;
}

export default function OrderTrackingTimeline({ status, order }: { status: string; order: Record<string, unknown> }) {
  if (status === "CANCELLED") {
    return (
      <div className="bg-red-50/70 border border-red-200 p-5 space-y-1 shadow-sm">
        <span className="inline-flex items-center gap-2 text-red-700 text-xs font-bold uppercase tracking-widest">
          <XCircle className="w-4 h-4" />
          Order Cancelled
        </span>
        {(order.cancelledAt as string) && (
          <p className="text-xs text-red-600 pl-6">
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
    <div className="bg-white p-5 sm:p-6 border border-[#7A0B2E]/20 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-3">
        <h3 className="font-serif text-[#2D1F2F] text-base sm:text-lg tracking-wide">
          Order Tracking
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#FAFAFA] text-[#7A0B2E] border border-[#7A0B2E]/30">
          {status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-6 overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[480px] grid grid-cols-5 relative">
          {steps.map((step, i) => {
            const reached = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center relative text-center px-1">
                {i > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-[2px] -z-0 ${
                      i <= currentIndex ? "bg-[#7A0B2E]" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold leading-none transition-all duration-300 ${
                    reached
                      ? isCurrent
                        ? "bg-[#7A0B2E] border-[#7A0B2E] text-white ring-4 ring-[#7A0B2E]/15"
                        : "bg-[#7A0B2E] border-[#7A0B2E] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {reached ? <Check className="w-4 h-4 stroke-[2.5]" /> : <span>{i + 1}</span>}
                </div>
                <p
                  className={`mt-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                    reached ? "text-[#2D1F2F]" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.time && (
                  <p className="mt-0.5 text-[8px] sm:text-[9px] text-gray-400 font-medium">
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

