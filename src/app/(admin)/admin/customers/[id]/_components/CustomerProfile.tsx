import UserRoleSelect from "@/app/(admin)/admin/customers/_components/UserRoleSelect";
import WorkerCapabilitiesSelect from "@/app/(admin)/admin/customers/_components/WorkerCapabilitiesSelect";

interface CustomerProfileProps {
  customer: any;
}

export default function CustomerProfile({ customer }: CustomerProfileProps) {
  return (
    <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Profile Details</h3>
      <div className="text-sm space-y-4">
        <div>
          <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Email</span>
          <span className="text-[#4A3B2C] font-semibold">{customer.email || "No email"}</span>
        </div>
        <div>
          <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Phone</span>
          <span className="text-[#4A3B2C] font-semibold font-mono">{customer.phoneNumber || "No phone number"}</span>
        </div>
        <div>
          <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1">Role</span>
          <UserRoleSelect userId={customer.id} currentRole={customer.role} />
        </div>
        {customer.role === "MULTI_WORKER" && (
          <div className="md:col-span-3">
            <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1">Worker Capabilities</span>
            <WorkerCapabilitiesSelect
              userId={customer.id}
              canInventory={customer.canManageInventory}
              canShipping={customer.canManageShipping}
            />
          </div>
        )}
        <div>
          <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold mb-1">Status</span>
          <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest
            ${customer.isDisabled ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#FAFAFA] text-green-700 border border-[#B6925B]/20"}`}>
            {customer.isDisabled ? "Banned" : "Active"}
          </span>
        </div>
      </div>
    </div>
  );
}
