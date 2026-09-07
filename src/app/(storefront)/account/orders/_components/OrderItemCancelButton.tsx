"use client";
import { useState } from "react";
import { cancelOrder } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { XCircle, Loader2 } from "lucide-react";

const CANCELLATION_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Shipping takes too long",
  "Other",
];

interface OrderItemCancelButtonProps {
  orderId: string;
  orderItemId: string;
  productName: string;
  itemPrice: number;
  itemQuantity: number;
}

export default function OrderItemCancelButton({
  orderId,
  orderItemId,
  productName,
  itemPrice,
  itemQuantity,
}: OrderItemCancelButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  const toast = useToast();

  const handleCancelItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === "Other" ? otherReason.trim() : reason;
    if (reason === "Other" && !finalReason) {
      toast.error("Please specify your reason.");
      return;
    }

    setLoading(true);
    try {
      await cancelOrder(orderId, finalReason, [orderItemId]);
      toast.success(`"${productName}" has been cancelled from your order.`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors border border-red-200 hover:border-red-400 bg-red-50/50 hover:bg-red-50 px-2.5 py-1"
      >
        <XCircle className="w-3 h-3" />
        <span>Cancel This Item</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-none border border-[#7A0B2E]/20 shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-serif text-[#2D1F2F] mb-1 tracking-wide">
              Cancel Item
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Are you sure you want to cancel{" "}
              <strong className="text-[#2D1F2F]">{productName}</strong> (Qty: {itemQuantity})?
            </p>

            <div className="bg-[#F5EFE6] border border-[#7A0B2E]/20 p-3 mb-4 text-xs flex justify-between items-center">
              <span className="font-bold text-[#2D1F2F]">Item Value:</span>
              <span className="font-bold text-[#7A0B2E]">
                ₹{(itemPrice * itemQuantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <form onSubmit={handleCancelItem} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-2">
                  Reason for cancellation
                </label>
                <div className="space-y-2">
                  {CANCELLATION_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700 hover:text-black">
                      <input
                        type="radio"
                        name="item_cancel_reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-3.5 h-3.5 text-[#7A0B2E] border-gray-300 focus:ring-[#7A0B2E]"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>

                {reason === "Other" && (
                  <div className="pt-2">
                    <textarea
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      rows={2}
                      required
                      placeholder="Please specify..."
                      className="w-full rounded-none border border-[#7A0B2E]/30 px-3 py-2 text-xs text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#7A0B2E]/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#2D1F2F] transition-colors"
                >
                  Keep Item
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
