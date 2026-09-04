import Link from "next/link";
import SignupForm from "@/app/(auth)/signup/_components/SignupForm";

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Create an Account</h1>
        <p className="text-sm text-gray-500 mt-2">Join Myra to unlock faster checkout and exclusive offers.</p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-gray-600 pt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[#7A0B2E] font-bold hover:underline">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
