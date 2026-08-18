"use client";
import { useState } from "react";
import {
  approveReturn,
  rejectReturn,
  markReturnPickedUp,
  issueReturnRefund,
  markReturnReplaced,
  scheduleReversePickup,
} from "@/actions/admin/returns";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface AdminReturnProcessorProps {
  request: {
    id: string;
    status: string;
    type: string;
    adminNote: string | null;
    order: { id: string; totalAmount: number; refundedAmount: number };
    orderItem: { quantity: number; price: number };
    shipmentId: string | null;
    awbNumber: string | null;
    reversePickupScheduledAt: Date | null;
  };
}

export default function AdminReturnProcessor({ request }: AdminReturnProcessorProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [adminNote, setAdminNote] = useState(request.adminNote || "");
  const [refundAmount, setRefundAmount] = useState("");

  const remaining = request.order.totalAmount - (request.order.refundedAmount || 0);
  const maxRefundable = Math.min(request.orderItem.price * request.orderItem.quantity, remaining);

  const run = async (action: () => Promise<void>, success: string) => {
    setLoading(true);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#B6925B]/20 shadow-sm p-6 space-y-5">
      <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">Process Request</h3>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">
          Admin Note (shown to customer on decision)
        </label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={3}
          className="w-full rounded-none border border-[#B6925B]/30 px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
          placeholder="Optional note explaining the decision..."
        />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[#B6925B]/10 pt-5">
        {request.status === "PENDING" && (
          <>
            <button
              onClick={() => run(() => approveReturn(request.id, adminNote), "Return approved.")}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#B6925B] hover:bg-[#9c7d4e] text-white text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-60"
            >
              <i className="ri-check-double-line text-sm" /> Approve
            </button>
            <button
              onClick={() => run(() => rejectReturn(request.id, adminNote), "Return rejected.")}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-60"
            >
              <i className="ri-close-circle-line text-sm" /> Reject
            </button>
          </>
        )}

        {request.status === "APPROVED" && (
          <>
            {request.reversePickupScheduledAt ? (
              <div className="w-full space-y-2 border border-[#B6925B]/20 bg-[#FAFAFA] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">
                  <i className="ri-checkbox-circle-line mr-1 align-middle" />
                  Reverse pickup scheduled via Shiprocket
                </p>
                {request.shipmentId && (
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Return Shipment ID: <span className="text-[#4A3B2C] font-mono">{request.shipmentId}</span></p>
                )}
                {request.awbNumber && (
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">AWB: <span className="text-[#4A3B2C] font-mono">{request.awbNumber}</span></p>
                )}
                <button
                  onClick={() => run(() => markReturnPickedUp(request.id), "Goods marked as picked up.")}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-60"
                >
                  <i className="ri-truck-fill text-sm" /> Mark as Picked Up (restocks item)
                </button>
              </div>
            ) : (
              <button
                onClick={() => run(() => scheduleReversePickup(request.id), "Reverse pickup scheduled.")}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4A3B2C] hover:bg-[#B6925B] text-white text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-60"
              >
                <i className="ri-truck-line text-sm" /> Schedule Reverse Pickup via Shiprocket
              </button>
            )}
          </>
        )}

        {request.status === "PICKED_UP" && request.type === "RETURN" && (
          <div className="w-full flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
                Refund Amount (₹) — Max ₹{maxRefundable.toFixed(2)}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={maxRefundable}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-none border border-[#B6925B]/30 px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
              />
            </div>
            <button
              onClick={() => run(() => issueReturnRefund(request.id, parseFloat(refundAmount)), "Refund issued.")}
              disabled={loading || !refundAmount}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-60"
            >
              <i className="ri-money-rupee-circle-line text-sm" /> Issue Refund
            </button>
          </div>
        )}

        {request.status === "PICKED_UP" && request.type === "REPLACEMENT" && (
          <button
            onClick={() => run(() => markReturnReplaced(request.id), "Replacement marked as shipped.")}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-60"
          >
            <i className="ri-refresh-line text-sm" /> Mark Replacement Shipped
          </button>
        )}

        {(request.status === "REFUNDED" || request.status === "REPLACED" || request.status === "REJECTED" || request.status === "CANCELLED") && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            This request has been {request.status.toLowerCase().replace(/_/g, " ")}.
          </p>
        )}
      </div>
    </div>
  );
}