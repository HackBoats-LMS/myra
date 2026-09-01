import { MapPin, Phone, User as UserIcon } from "lucide-react";

interface OrderAddressProps {
  user: {
    name?: string | null;
    phoneNumber?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  address?: {
    label?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
  } | null;
}

export default function OrderAddress({ user, address }: OrderAddressProps) {
  const contactPhone = address?.phone || user.phoneNumber;

  return (
    <div className="bg-white p-5 sm:p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#B6925B]" />
          <h3 className="font-serif text-[#4A3B2C] text-base sm:text-lg tracking-wide">
            Delivery Address
          </h3>
        </div>
        {address?.label && (
          <span className="text-[9px] font-bold text-[#B6925B] uppercase tracking-widest bg-[#FAFAFA] border border-[#B6925B]/20 px-2 py-0.5">
            {address.label}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-600 space-y-2 leading-relaxed pt-0.5">
        <div className="flex items-center gap-2">
          <UserIcon className="w-3.5 h-3.5 text-[#B6925B]" />
          <p className="font-bold text-[#4A3B2C] text-sm tracking-normal capitalize">
            {user.name || "Customer"}
          </p>
        </div>

        <div className="pl-5.5 space-y-0.5 text-gray-600">
          {address ? (
            <>
              <p className="font-medium text-[#4A3B2C]">{address.addressLine1}</p>
              <p>
                {address.city}, {address.state} - <span className="font-mono">{address.postalCode}</span>
              </p>
              <p className="capitalize text-gray-400">{address.country}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-[#4A3B2C]">{user.addressLine1 || "No address on file"}</p>
              {user.city && (
                <p>
                  {user.city}, {user.state} - <span className="font-mono">{user.postalCode}</span>
                </p>
              )}
              {user.country && <p className="capitalize text-gray-400">{user.country}</p>}
            </>
          )}
        </div>

        {contactPhone && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#B6925B]/10">
            <Phone className="w-3.5 h-3.5 text-[#B6925B]" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Phone:{" "}
              <span className="font-mono font-bold text-[#4A3B2C] tracking-normal">
                {contactPhone}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

