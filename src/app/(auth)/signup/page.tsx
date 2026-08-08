import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#0D3B66] tracking-tight">Create an Account</h1>
        <p className="text-sm text-gray-500 mt-2">Join Myra to unlock faster checkout and exclusive offers.</p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-gray-600 pt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[#A92A30] font-bold hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
