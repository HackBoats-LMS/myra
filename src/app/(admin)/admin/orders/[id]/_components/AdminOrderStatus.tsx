import { ExternalLink } from "lucide-react";

interface AdminOrderStatusProps {
  status: string;
  awbNumber: string | null;
  courierName: string | null;
  trackingUrl: string | null;
}

export default function AdminOrderStatus({ status, awbNumber, courierName, trackingUrl }: AdminOrderStatusProps) {
  return (
    <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-2">
      <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">Shipment / Tracking</h3>
      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
        <p><span className="text-[#4A3B2C]">Status:</span> {status.replace(/_/g, " ")}</p>
        <p><span className="text-[#4A3B2C]">AWB:</span> {awbNumber || "Not assigned"}</p>
        {courierName && <p><span className="text-[#4A3B2C]">Courier:</span> {courierName}</p>}
        {trackingUrl && (
          <p>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#B6925B] hover:text-[#4A3B2C] underline underline-offset-2 normal-case tracking-normal text-[11px]"
            >
              Track on Shiprocket <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
