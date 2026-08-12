"use client";
import { useState, Suspense } from "react";
import { resetPassword } from "@/actions/password";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";

function ResetPasswordForm() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset successfully! You can now log in.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-6">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-[#B6925B] hover:underline font-bold uppercase tracking-widest text-xs">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">New Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Confirm New Password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !password || !confirmPassword}
        className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex justify-center items-center"
      >
        {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="max-w-md w-full bg-white p-8 border border-[#B6925B]/20 shadow-sm">
        <h2 className="text-3xl font-serif text-[#4A3B2C] mb-8 text-center tracking-wide">Create New Password</h2>
        
        <Suspense fallback={<div className="flex justify-center"><ArrowPathIcon className="w-5 h-5 animate-spin text-[#B6925B]" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
