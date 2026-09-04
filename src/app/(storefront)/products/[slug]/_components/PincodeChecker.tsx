"use client";
import { useState } from "react";
import { checkPincodeAvailability } from "@/actions/pincode";
import { Truck } from "lucide-react";

export default function PincodeChecker() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ available: boolean; message: string } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await checkPincodeAvailability(code);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleCheck} className="flex items-center border border-[#7A0B2E] bg-white px-3 py-2">
        <Truck className="w-4 h-4 text-[#171717] shrink-0 mr-2.5" />
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setResult(null);
          }}
          inputMode="numeric"
          pattern="[0-9]{6}"
          placeholder="Check your pincode ..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-[#171717] placeholder:text-gray-500 focus:outline-none"
        />
        {code.length === 6 && (
          <button
            type="submit"
            disabled={loading}
            className="text-[11px] font-serif text-[#7A0B2E] hover:underline font-semibold uppercase tracking-wider ml-2 shrink-0 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check"}
          </button>
        )}
      </form>
      {result && (
        <p
          className={`mt-1.5 text-[11px] font-sans ${result.available ? "text-emerald-700 font-medium" : "text-red-600"}`}
        >
          <i className={`${result.available ? "ri-checkbox-circle-line" : "ri-close-circle-line"} mr-1 align-middle`} />
          {result.message}
        </p>
      )}
    </div>
  );
}