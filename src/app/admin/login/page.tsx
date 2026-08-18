import StaffLoginForm from "@/components/shared/StaffLoginForm";

export default function AdminLoginPage() {
  return (
    <StaffLoginForm
      title="Admin Portal"
      subtitle="Authorized Personnel Only"
      icon="ri-lock-line"
      redirectUrl="/admin/products"
      placeholderEmail="admin@myra.com"
    />
  );
}
