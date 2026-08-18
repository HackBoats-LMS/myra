"use client";
import { useState } from "react";
import { updateOrderDeliveryAddress } from "@/actions/storefront/user";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export interface SavedAddress {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function ChangeOrderAddressButton({
  orderId,
  addresses,
}: {
  orderId: string;
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedId) {
      toast.error("Please select an address.");
      return;
    }
    setLoading(true);
    try {
      await updateOrderDeliveryAddress(orderId, selectedId);
      toast.success("Delivery address updated successfully!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setSelectedId(null);
          setOpen(true);
        }}
        className="flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-[#4A3B2C] hover:text-white border border-[#B6925B]/30 text-[#4A3B2C] px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-colors"
      >
        <i className="ri-map-pin-2-line text-sm" />
        <span>Change Address</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl border border-[#B6925B]/20">
            <div className="p-6 border-b border-[#B6925B]/20 bg-[#FAFAFA] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#4A3B2C] tracking-wide">Change Delivery Address</h3>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="text-gray-400 hover:text-[#4A3B2C] transition-colors"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You have no saved addresses. Add one from your account page first.
                </p>
              ) : (
                addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedId(addr.id)}
                    disabled={loading}
                    className={`w-full text-left p-4 border rounded-none transition-colors ${
                      selectedId === addr.id
                        ? "border-[#B6925B] bg-[#FAFAFA]"
                        : "border-[#B6925B]/20 hover:border-[#B6925B]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">
                        {addr.label} Address
                      </span>
                      <i
                        className={`ri-radio-button-line text-lg ${
                          selectedId === addr.id ? "text-[#B6925B]" : "text-gray-300"
                        }`}
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#4A3B2C]">{addr.addressLine1}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{addr.country}</p>
                  </button>
                ))
              )}
            </div>

            <div className="p-6 border-t border-[#B6925B]/20 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A3B2C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || addresses.length === 0}
                className="bg-[#4A3B2C] hover:bg-[#34291f] text-white px-6 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading && <i className="ri-loader-4-line animate-spin text-sm" />}
                <span>Update Address</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
