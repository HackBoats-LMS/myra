"use client";
import { useState } from "react";
import { cancelOrder } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { XCircle, Loader2 } from "lucide-react";

import Image from "next/image";

const CANCELLATION_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Shipping takes too long",
  "Other"
];

interface OrderItemEntry {
  id: string;
  isCancelled: boolean;
  quantity?: number;
  price?: number;
  product?: {
    name: string;
    images?: string[];
  };
}

export default function CancelOrderButton({ orderId, orderItems }: { orderId: string, orderItems?: OrderItemEntry[] }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  
  // By default, select all active (uncancelled) items
  const activeItems = (orderItems || []).filter(item => !item.isCancelled);
  const [selectedItems, setSelectedItems] = useState<string[]>(activeItems.map(i => i.id));
  
  const toast = useToast();

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to cancel.");
      return;
    }

    const finalReason = reason === "Other" ? otherReason.trim() : reason;
    if (reason === "Other" && !finalReason) {
      toast.error("Please specify your reason.");
      return;
    }

    setLoading(true);
    try {
      await cancelOrder(orderId, finalReason, selectedItems);
      toast.success(selectedItems.length === activeItems.length ? "Order cancelled! Refunds take 5-7 business days to reflect." : "Selected items cancelled! Refunds take 5-7 business days to reflect.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setLoading(false);
    }
  };

  if (activeItems.length === 0) return null;

  return (
    <>
      <button
        onClick={() => {
          setSelectedItems(activeItems.map(i => i.id));
          setOpen(true);
        }}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-700 px-4 sm:px-5 py-2.5 rounded-none text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-sm border border-red-200 hover:border-red-300 disabled:opacity-50 flex-1 sm:flex-initial"
      >
        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Cancel Order</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-none border border-[#7A0B2E]/20 shadow-xl w-full max-w-md p-6 m-4 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-serif text-[#2D1F2F] mb-2 tracking-wide">
              Cancel Order
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Approved refunds typically take 5-7 business days to reflect in your original payment method.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeItems.length > 1 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-3">Select items to cancel</label>
                  <div className="space-y-3 border border-[#7A0B2E]/20 p-3 bg-[#FAFAFA]">
                    {activeItems.map(item => (
                      <label key={item.id} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleToggleItem(item.id)}
                            className="w-4 h-4 text-[#7A0B2E] border-gray-300 rounded focus:ring-[#7A0B2E]"
                          />
                          <div className="relative w-10 h-10 flex-shrink-0 bg-white border border-[#7A0B2E]/20 overflow-hidden">
                            {item.product?.images?.[0] && (
                              <Image src={item.product.images[0]} alt="" fill className="object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#2D1F2F] truncate">{item.product?.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#7A0B2E] ml-3">₹{((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] mb-3">Reason for cancellation</label>
                <div className="space-y-3">
                  {CANCELLATION_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="cancel_reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-4 h-4 text-[#7A0B2E] border-gray-300 focus:ring-[#7A0B2E]"
                      />
                      <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{r}</span>
                    </label>
                  ))}
                </div>

                {reason === "Other" && (
                  <div className="pt-2">
                    <textarea
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      rows={3}
                      required
                      placeholder="Please specify..."
                      className="w-full rounded-none border border-[#7A0B2E]/30 px-3 py-2 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#7A0B2E]/10">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#2D1F2F] transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

