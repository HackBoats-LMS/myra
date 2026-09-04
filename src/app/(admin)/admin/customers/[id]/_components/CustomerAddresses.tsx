interface AddressEntry {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface CustomerAddressesProps {
  addresses: AddressEntry[];
}

export default function CustomerAddresses({ addresses }: CustomerAddressesProps) {
  return (
    <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Saved Addresses ({addresses.length})</h3>
      {addresses.length === 0 ? (
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">No saved addresses.</p>
      ) : (
        <div className="space-y-4 divide-y divide-[#B6925B]/10">
          {addresses.map((addr) => (
            <div key={addr.id} className="pt-4 first:pt-0 text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1.5 leading-relaxed">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[#4A3B2C]">{addr.label}</span>
                {addr.isDefault && (
                  <span className="bg-[#4A3B2C] text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest">
                    Default
                  </span>
                )}
              </div>
              <p className="normal-case text-gray-600 font-semibold">{addr.addressLine1}</p>
              <p className="normal-case text-gray-600 font-semibold">{addr.city}, {addr.state} - {addr.postalCode}</p>
              <p className="capitalize">{addr.country}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
