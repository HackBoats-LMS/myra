import Link from "next/link";
import PrintInvoiceButton from "@/components/shared/PrintInvoiceButton";
import ReorderButton from "@/app/(storefront)/account/orders/_components/ReorderButton";
import CancelOrderButton from "@/app/(storefront)/account/orders/_components/CancelOrderButton";
import ChangeOrderAddressButton from "@/app/(storefront)/account/orders/_components/ChangeOrderAddressButton";
import type { SavedAddress } from "@/app/(storefront)/account/orders/_components/ChangeOrderAddressButton";
import { ArrowLeft } from "lucide-react";

interface OrderHeaderProps {
  orderId: string;
  createdAt: Date;
  status: string;
  canChangeAddress: boolean;
  savedAddresses: SavedAddress[];
}

export default function OrderHeader({ orderId, createdAt, status, canChangeAddress, savedAddresses }: OrderHeaderProps) {
  const shortId = orderId.split("-")[0].toUpperCase();

  return (
    <div className="space-y-4 border-b border-[#B6925B]/20 pb-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to My Orders</span>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">
              Order Details
            </h1>
            <span className="font-mono text-xs font-bold text-[#4A3B2C] bg-white border border-[#B6925B]/30 px-2.5 py-1">
              #{shortId}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-1.5">
            Placed on{" "}
            <span className="text-[#4A3B2C]">
              {new Date(createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 md:pt-0">
          <PrintInvoiceButton />
          {status !== "CANCELLED" && (
            <ReorderButton orderId={orderId} />
          )}
          {status === "PENDING" && (
            <CancelOrderButton orderId={orderId} />
          )}
          {canChangeAddress && (
            <ChangeOrderAddressButton orderId={orderId} addresses={savedAddresses} />
          )}
        </div>
      </div>
    </div>
  );
}
