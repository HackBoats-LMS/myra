interface AdminOrderCustomerDetailsProps {
  order: any;
}

export default function AdminOrderCustomerDetails({ order }: AdminOrderCustomerDetailsProps) {
  return (
    <>
      <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
        <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">Customer Details</h3>
        <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-3 pt-1">
          <p><span className="text-[#4A3B2C]">Name:</span> {order.user.name || 'N/A'}</p>
          <p><span className="text-[#4A3B2C]">Email:</span> {order.user.email || 'N/A'}</p>
          <p><span className="text-[#4A3B2C]">Phone:</span> {order.user.phoneNumber || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-2">
        <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">
          {order.giftName ? "Delivery Recipient (Gift)" : "Delivery Address"}
        </h3>
        <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
          {order.giftName ? (
            <>
              <p><span className="text-[#4A3B2C]">Name:</span> {order.giftName}</p>
              <p><span className="text-[#4A3B2C]">Phone:</span> {order.giftPhone || 'N/A'}</p>
              <p className="normal-case tracking-normal text-[11px]">
                {order.giftAddressLine1}, {order.giftCity}, {order.giftState} {order.giftPostalCode}, {order.giftCountry}
              </p>
            </>
          ) : order.address ? (
            <>
              {order.address.phone && (
                <p><span className="text-[#4A3B2C]">Phone:</span> {order.address.phone}</p>
              )}
              <p className="normal-case tracking-normal text-[11px]">
                {order.address.addressLine1}, {order.address.city}, {order.address.state} {order.address.postalCode},{" "}
                {order.address.country}
              </p>
            </>
          ) : (
            <p>No delivery address on file.</p>
          )}
        </div>
      </div>
    </>
  );
}
