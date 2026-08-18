import ShipOrderButton from "@/components/shared/ShipOrderButton";
import PrintInvoiceButton from "@/components/shared/PrintInvoiceButton";

interface AdminOrderHeaderProps {
  orderId: string;
  createdAt: Date;
  shipmentId: string | null;
}

export default function AdminOrderHeader({ orderId, createdAt, shipmentId }: AdminOrderHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-6">
      <div>
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Order #{orderId.split('-')[0]}</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Placed on {new Date(createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3">
        <PrintInvoiceButton />
        <div className="flex items-center gap-3 print:hidden">
          <ShipOrderButton orderId={orderId} shipped={Boolean(shipmentId)} />
        </div>
      </div>
    </div>
  );
}
