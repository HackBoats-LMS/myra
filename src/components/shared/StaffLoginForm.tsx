"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface StaffLoginFormProps {
  title: string;
  subtitle: string;
  icon: string;
  redirectUrl: string;
  placeholderEmail: string;
}

export default function StaffLoginForm({ title, subtitle, icon, redirectUrl, placeholderEmail }: StaffLoginFormProps) {
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

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#FAFAFA] rounded-none">
      <div className="w-full max-w-md bg-white p-8 border border-[#B6925B]/20 shadow-sm rounded-none">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#4A3B2C] flex items-center justify-center mb-4 rounded-none">
            <i className={`${icon} text-xl text-[#B6925B]`} />
          </div>
          <h1 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">{title}</h1>
          <p className="text-xs text-[#B6925B] uppercase tracking-widest mt-2 font-bold">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 text-center rounded-none">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Staff Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
              placeholder={placeholderEmail}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-3 text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center disabled:opacity-70 mt-6 rounded-none"
          >
            {isLoading ? <i className="ri-loader-4-line animate-spin text-sm" /> : "AUTHENTICATE"}
          </button>
        </form>
      </div>
    </div>
  );
}
