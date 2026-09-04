"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Wrench } from "lucide-react";

interface StaffLoginFormProps {
  title: string;
  subtitle: string;
  iconName?: "lock" | "wrench";
  redirectUrl: string;
  placeholderEmail: string;
}

export default function StaffLoginForm({ title, subtitle, iconName = "lock", redirectUrl, placeholderEmail }: StaffLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        phoneOrEmail: email,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials");
      } else {
        router.push(redirectUrl);
        router.refresh();
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderIcon = () => {
    if (iconName === "wrench") {
      return <Wrench className="w-6 h-6 text-[#7A0B2E]" />;
    }
    return <Lock className="w-6 h-6 text-[#7A0B2E]" />;
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#FAFAFA] rounded-none">
      <div className="w-full max-w-md bg-white p-8 border border-[#7A0B2E]/20 shadow-sm rounded-none">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#2D1F2F] flex items-center justify-center mb-4 rounded-none">
            {renderIcon()}
          </div>
          <h1 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">{title}</h1>
          <p className="text-xs text-[#7A0B2E] uppercase tracking-widest mt-2 font-bold">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 text-center rounded-none">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-wider mb-2">Staff Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-[#7A0B2E]/30 px-4 py-3 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
              placeholder={placeholderEmail}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#2D1F2F] uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-[#7A0B2E]/30 px-4 py-3 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] rounded-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center disabled:opacity-70 mt-6 rounded-none"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "AUTHENTICATE"}
          </button>
        </form>
      </div>
    </div>
  );
}
