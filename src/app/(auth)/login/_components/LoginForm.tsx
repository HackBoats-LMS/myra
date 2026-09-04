"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const safeCallbackUrl = callbackUrl.startsWith("/") && !callbackUrl.includes("://") ? callbackUrl : "/";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        phoneOrEmail: phoneNumber,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        if (safeCallbackUrl === "/") {
          const { getSession } = await import("next-auth/react");
          const session = await getSession();
          if (session?.user?.role === "ADMIN") {
            router.push("/admin");
          } else if (session?.user?.role === "MULTI_WORKER") {
            router.push("/worker");
          } else {
            router.push("/");
          }
        } else {
          router.push(safeCallbackUrl);
        }
        router.refresh();
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: safeCallbackUrl });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-none border border-red-100">{error}</div>}
        
        <div>
          <label className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-wider mb-2">Phone or Email</label>
          <input
            type="text"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full bg-white border border-[#7A0B2E]/30 px-4 py-3 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
            placeholder="Phone number or email"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-[#7A0B2E]/30 px-4 py-3 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-bold text-[#7A0B2E] hover:text-[#5C0820] uppercase tracking-widest transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors flex items-center justify-center disabled:opacity-70 rounded-none"
        >
          {isLoading ? <i className="ri-loader-4-line animate-spin text-base" /> : "Sign In"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#7A0B2E]/20" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#FAFAFA] text-xs font-medium text-gray-500 uppercase tracking-widest">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
        className="w-full bg-white border border-[#7A0B2E]/30 text-[#2D1F2F] hover:bg-[#FAF0F2] px-4 py-3 text-sm font-bold tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-70 shadow-sm rounded-none"
      >
        {isGoogleLoading ? (
          <i className="ri-loader-4-line animate-spin text-base text-[#7A0B2E]" />
        ) : null}
        CONTINUE WITH GOOGLE
      </button>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><i className="ri-loader-4-line animate-spin text-3xl text-[#7A0B2E]" /></div>}>
      <LoginFormInner />
    </Suspense>
  );
}
