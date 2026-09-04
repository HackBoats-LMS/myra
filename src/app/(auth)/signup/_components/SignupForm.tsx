"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register");
      }

      // Automatically log them in after registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        phoneOrEmail: phoneNumber,
        password,
      });

      if (signInRes?.error) {
        throw new Error("Failed to sign in after registration");
      }

      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else if (session?.user?.role === "MULTI_WORKER") {
        router.push("/worker");
      } else {
        router.push("/");
      }
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-none border border-red-100">{error}</div>}
        
        <div>
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Email Address (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Phone Number</label>
          <input
            type="text"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full bg-white border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
            placeholder="e.g. 9876543210"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
            placeholder="Create a strong password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-3 text-sm font-bold tracking-widest uppercase transition-colors flex items-center justify-center disabled:opacity-70 mt-4 rounded-none"
        >
          {isLoading ? <i className="ri-loader-4-line animate-spin text-base" /> : "Create Account"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#B6925B]/20" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#FAFAFA] text-xs font-medium text-gray-500 uppercase tracking-widest">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
        className="w-full bg-white border border-[#B6925B]/30 text-[#4A3B2C] hover:bg-[#FDFBF7] px-4 py-3 text-sm font-bold tracking-widest transition-colors flex items-center justify-center gap-3 disabled:opacity-70 shadow-sm rounded-none"
      >
        {isGoogleLoading ? (
          <i className="ri-loader-4-line animate-spin text-base text-[#B6925B]" />
        ) : null}
        CONTINUE WITH GOOGLE
      </button>
    </div>
  );
}
