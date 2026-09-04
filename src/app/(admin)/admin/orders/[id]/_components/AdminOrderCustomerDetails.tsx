interface OrderWithUser {
  user: {
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
  };
  giftName: string | null;
  giftPhone: string | null;
  giftAddressLine1: string | null;
  giftCity: string | null;
  giftState: string | null;
  giftPostalCode: string | null;
  giftCountry: string | null;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
    label: string;
  } | null;
}

interface AdminOrderCustomerDetailsProps {
  order: OrderWithUser;
}

export default function AdminOrderCustomerDetails({ order }: AdminOrderCustomerDetailsProps) {
  return (
    <>
      <div className="bg-white p-6 border border-[#7A0B2E]/20 shadow-sm space-y-4">
        <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-2">Customer Details</h3>
        <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-3 pt-1">
          <p><span className="text-[#2D1F2F]">Name:</span> {order.user.name || 'N/A'}</p>
          <p><span className="text-[#2D1F2F]">Email:</span> {order.user.email || 'N/A'}</p>
          <p><span className="text-[#2D1F2F]">Phone:</span> {order.user.phoneNumber || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white p-6 border border-[#7A0B2E]/20 shadow-sm space-y-2">
        <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-2">
          {order.giftName ? "Delivery Recipient (Gift)" : "Delivery Address"}
        </h3>
        <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
          {order.giftName ? (
            <>
              <p><span className="text-[#2D1F2F]">Name:</span> {order.giftName}</p>
              <p><span className="text-[#2D1F2F]">Phone:</span> {order.giftPhone || 'N/A'}</p>
              <p className="normal-case tracking-normal text-[11px]">
                {order.giftAddressLine1}, {order.giftCity}, {order.giftState} {order.giftPostalCode}, {order.giftCountry}
              </p>
            </>
          ) : order.address ? (
            <>
              {order.address.phone && (
                <p><span className="text-[#2D1F2F]">Phone:</span> {order.address.phone}</p>
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
