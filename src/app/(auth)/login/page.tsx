import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#0D3B66] tracking-tight">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-2">Sign in to your Myra account to track orders and save your favorites.</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-gray-600 pt-4">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#A92A30] font-bold hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
}
