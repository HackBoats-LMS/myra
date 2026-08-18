import StaffLoginForm from "@/components/shared/StaffLoginForm";

export default function WorkerLoginPage() {
  return (
    <StaffLoginForm
      title="Worker Portal"
      subtitle="Inventory & Shipping Staff"
      icon="ri-tools-line"
      redirectUrl="/worker"
      placeholderEmail="worker@myra.com"
    />
  );
}