"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
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
        setError("Invalid admin credentials");
      } else {
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#0D3B66] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100 text-center">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Staff Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50 bg-gray-50 focus:bg-white transition-colors"
              placeholder="admin@myra.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50 bg-gray-50 focus:bg-white transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0D3B66] hover:bg-[#082a4d] text-white px-4 py-3 rounded-md text-sm font-bold tracking-widest transition-colors flex items-center justify-center disabled:opacity-70 mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
          </button>
        </form>
      </div>
    </div>
  );
}
