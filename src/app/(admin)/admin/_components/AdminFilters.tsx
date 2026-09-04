"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminFilters({
  search,
  placeholder = "Search...",
  statusOptions,
  status,
  selectName = "status",
  selectLabel = "All statuses",
}: {
  search?: string;
  placeholder?: string;
  statusOptions?: { value: string; label: string }[];
  status?: string;
  selectName?: string;
  selectLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [term, setTerm] = useState(search || "");
  const [statusValue, setStatusValue] = useState(status || "");

  const apply = (q?: string, st?: string) => {
    const params = new URLSearchParams();
    const query = q !== undefined ? q : term.trim();
    const sel = st !== undefined ? st : statusValue;
    if (query) params.set("search", query);
    if (sel) params.set(selectName, sel);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const hasFilters = Boolean(search || status);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <form
        className="flex-1 flex"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F] text-sm"
        />
        <button
          type="submit"
          className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors"
        >
          Search
        </button>
      </form>
      {statusOptions && (
        <select
          value={statusValue}
          onChange={(e) => {
            setStatusValue(e.target.value);
            apply(undefined, e.target.value);
          }}
          className="px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F] text-sm"
        >
          <option value="">{selectLabel}</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      {hasFilters && (
        <button
          onClick={() => {
            setTerm("");
            setStatusValue("");
            router.push(pathname);
          }}
          className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#2D1F2F] px-2"
        >
          Clear
        </button>
      )}
    </div>
  );
}
