import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-2">Sign in to your Myra account to track orders and save your favorites.</p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-10"><i className="ri-loader-4-line animate-spin text-3xl text-[#7A0B2E]" /></div>}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-gray-600 pt-4">
        Don&rsquo;t have an account?{" "}
        <Link href="/signup" className="text-[#7A0B2E] font-bold hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
}
