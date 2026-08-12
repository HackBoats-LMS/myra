"use client";

import { useState } from "react";
import { processRefund } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, CurrencyRupeeIcon } from "@heroicons/react/24/outline";

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
      <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded uppercase tracking-wider">
        Fully Refunded
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="print:hidden flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium rounded-md transition-colors"
      >
        <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
        Issue Refund
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Process Refund</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the amount you wish to refund. Maximum refundable amount is ₹{maxRefundable.toFixed(2)}.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={maxRefundable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
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
