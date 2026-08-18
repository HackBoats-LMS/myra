"use client";
import { useState } from "react";
import { checkPincodeAvailability } from "@/actions/storefront/pincode";

export default function PincodeChecker() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ available: boolean; message: string } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await checkPincodeAvailability(code);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleCheck} className="flex items-stretch gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setResult(null);
          }}
          inputMode="numeric"
          pattern="[0-9]{6}"
          placeholder="Enter pincode"
          className="w-40 rounded-none border border-[#B6925B]/30 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-60 rounded-none"
        >
          {loading ? <i className="ri-loader-4-line animate-spin text-sm" /> : "Check"}
        </button>
      </form>
      {result && (
        <p
          className={`mt-2 text-[11px] font-bold tracking-wide ${result.available ? "text-green-700" : "text-red-600"}`}
        >
          <i className={`${result.available ? "ri-checkbox-circle-line" : "ri-close-circle-line"} mr-1 align-middle`} />
          {result.message}
        </p>
      )}
    </div>
  );
}