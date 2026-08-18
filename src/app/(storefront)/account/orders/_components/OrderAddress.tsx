interface OrderAddressProps {
  user: any;
  address: any;
}

export default function OrderAddress({ user, address }: OrderAddressProps) {
  return (
    <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
      <h3 className="font-serif text-[#4A3B2C] text-lg tracking-wide border-b border-[#B6925B]/20 pb-3">Delivery Address</h3>
      <div className="text-[11px] text-gray-600 space-y-1.5 leading-relaxed pt-1 font-medium">
        <p className="font-bold text-[#4A3B2C] text-sm tracking-normal capitalize mb-2">{user.name}</p>
        {address ? (
          <>
            <p className="text-[9px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">({address.label} Address)</p>
            <p>{address.addressLine1}</p>
            <p>{address.city}, {address.state} - {address.postalCode}</p>
            <p className="capitalize">{address.country}</p>
          </>
        ) : (
          <>
            <p>{user.addressLine1 || "No address provided"}</p>
            <p>{user.city}, {user.state} - {user.postalCode}</p>
            <p className="capitalize">{user.country}</p>
          </>
        )}
        {user.phoneNumber && (
          <p className="mt-4 text-[#4A3B2C] font-mono text-[10px] font-bold uppercase tracking-widest">Phone: <span className="tracking-normal normal-case font-medium">{user.phoneNumber}</span></p>
        )}
      </div>
    </div>
  );
}
