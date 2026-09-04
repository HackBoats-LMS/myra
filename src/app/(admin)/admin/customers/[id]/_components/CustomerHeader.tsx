import EditCustomerForm from "@/app/(admin)/admin/customers/_components/EditCustomerForm";
import DisableUserButton from "@/app/(admin)/admin/customers/_components/DisableUserButton";

interface CustomerEntry {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  isDisabled: boolean;
  createdAt: Date;
  canManageInventory: boolean;
  canManageShipping: boolean;
}

interface CustomerHeaderProps {
  customer: CustomerEntry;
}

export default function CustomerHeader({ customer }: CustomerHeaderProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B6925B]/20 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">{customer.name || "Unnamed Customer"}</h1>
          <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Registered on {new Date(customer.createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}</p>
        </div>
        <div className="flex items-center gap-3">
          <EditCustomerForm
            userId={customer.id}
            name={customer.name}
            email={customer.email}
            phoneNumber={customer.phoneNumber}
          />
          <DisableUserButton userId={customer.id} initialDisabled={customer.isDisabled} />
        </div>
      </div>
    </div>
  );
}
