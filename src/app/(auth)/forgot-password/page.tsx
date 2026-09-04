"use client";
import { useState } from "react";
import { generateResetToken } from "@/actions/password";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await generateResetToken(email);
      setIsSuccess(true);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 rounded-none">
      <div className="max-w-md w-full bg-white p-8 border border-[#7A0B2E]/20 shadow-sm rounded-none">
        <h2 className="text-3xl font-serif text-[#2D1F2F] mb-2 text-center tracking-wide">Forgot Password</h2>
        
        {isSuccess ? (
          <div className="text-sm text-gray-600 mb-6 text-center mt-6 rounded-none">
            We&rsquo;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox (and spam folder) and click the link to reset your password.
            <div className="mt-8">
              <Link href="/login" className="text-[#7A0B2E] font-bold hover:underline uppercase tracking-widest text-xs rounded-none">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-8 text-center mt-4">
              Enter your email address and we&rsquo;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-[#7A0B2E]/30 px-4 py-3 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-3 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex justify-center items-center rounded-none"
              >
                {isLoading ? <i className="ri-loader-4-line animate-spin text-sm" /> : "Send Reset Link"}
              </button>
            </form>

          </>
        )}
      </div>
    </div>
  );
}
