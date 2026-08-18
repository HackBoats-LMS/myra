import Link from "next/link";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-2">Sign in to your Myra account to track orders and save your favorites.</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-gray-600 pt-4">
        Don&rsquo;t have an account?{" "}
        <Link href="/signup" className="text-[#B6925B] font-bold hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
}
