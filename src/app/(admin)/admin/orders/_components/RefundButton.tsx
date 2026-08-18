"use client";
import { useState } from "react";
import { processRefund } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";

interface RefundButtonProps {
  orderId: string;
  totalAmount: number;
  refundedAmount: number;
}

export default function RefundButton({ orderId, totalAmount, refundedAmount }: RefundButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const toast = useToast();

  const maxRefundable = totalAmount - refundedAmount;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("amount", amount);

    try {
      await processRefund(orderId, formData);
      toast.success("Refund processed successfully!");
      setIsOpen(false);
      setAmount("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (maxRefundable <= 0) {
    return (
      <span className="text-[10px] font-bold px-2.5 py-1 bg-[#FAFAFA] text-gray-500 rounded-none uppercase tracking-widest border border-[#B6925B]/20">
        Fully Refunded
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="print:hidden flex items-center px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-bold uppercase tracking-widest rounded-none border border-red-200 transition-colors gap-1.5"
      >
        <i className="ri-money-rupee-circle-line text-sm" />
        Issue Refund
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-none border border-[#B6925B]/20 shadow-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-serif text-[#4A3B2C] mb-2 tracking-wide">Process Refund</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">
              Enter the amount you wish to refund. Maximum refundable amount is ₹{maxRefundable.toFixed(2)}.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={maxRefundable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-none border border-[#B6925B]/20 px-3 py-2 text-sm focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end pt-4 space-x-3 border-t border-[#B6925B]/10 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-[10px] font-bold text-gray-500 hover:text-[#4A3B2C] uppercase tracking-widest transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 gap-1.5"
                >
                  {isSubmitting && <i className="ri-loader-4-line animate-spin text-sm" />}
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
