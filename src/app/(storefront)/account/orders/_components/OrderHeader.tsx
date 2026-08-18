import PrintInvoiceButton from "@/components/shared/PrintInvoiceButton";
import ReorderButton from "@/app/(storefront)/account/orders/_components/ReorderButton";
import CancelOrderButton from "@/app/(storefront)/account/orders/_components/CancelOrderButton";
import ChangeOrderAddressButton from "@/app/(storefront)/account/orders/_components/ChangeOrderAddressButton";

interface OrderHeaderProps {
  orderId: string;
  createdAt: Date;
  status: string;
  canChangeAddress: boolean;
  savedAddresses: any[];
}

export default function OrderHeader({ orderId, createdAt, status, canChangeAddress, savedAddresses }: OrderHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B6925B]/20 pb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">Order Details</h1>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">
          Placed on {new Date(createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
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
  );
}
