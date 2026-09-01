import StaffLoginForm from "@/components/shared/StaffLoginForm";

export default function WorkerLoginPage() {
  return (
    <StaffLoginForm
      title="Worker Portal"
      subtitle="Inventory & Shipping Staff"
      iconName="wrench"
      redirectUrl="/worker"
      placeholderEmail="worker@myra.com"
    />
  );
}
