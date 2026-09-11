"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, X, Filter, RotateCcw } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface AdminFiltersProps {
  search?: string;
  placeholder?: string;
  statusOptions?: Option[];
  status?: string;
  selectName?: string;
  selectLabel?: string;
  collectionOptions?: Option[];
  collection?: string;
  collectionName?: string;
  collectionLabel?: string;
}

export default function AdminFilters({
  search,
  placeholder = "Search...",
  statusOptions,
  status,
  selectName = "status",
  selectLabel = "All statuses",
  collectionOptions,
  collection,
  collectionName = "collection",
  collectionLabel = "All collections",
}: AdminFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [term, setTerm] = useState(search || "");
  const [statusValue, setStatusValue] = useState(status || "");
  const [collectionValue, setCollectionValue] = useState(collection || "");

  useEffect(() => {
    setTerm(search || "");
  }, [search]);

  useEffect(() => {
    setStatusValue(status || "");
  }, [status]);

  useEffect(() => {
    setCollectionValue(collection || "");
  }, [collection]);

  const apply = (newSearch?: string, newStatus?: string, newCollection?: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    const s = newSearch !== undefined ? newSearch : term.trim();
    const st = newStatus !== undefined ? newStatus : statusValue;
    const col = newCollection !== undefined ? newCollection : collectionValue;

    if (s) params.set("search", s);
    else params.delete("search");

    if (st) params.set(selectName, st);
    else params.delete(selectName);

    if (col) params.set(collectionName, col);
    else params.delete(collectionName);

    // Reset page to 1 on new filter
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleClearAll = () => {
    setTerm("");
    setStatusValue("");
    setCollectionValue("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(search || status || collection);

  return (
    <div className="space-y-3 bg-white p-4 border border-[#7A0B2E]/15 shadow-2xs">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search Input Box */}
        <form
          className="flex-1 relative flex items-center"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <Search className="w-4 h-4 text-[#7A0B2E] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-2 text-xs bg-white border border-[#7A0B2E]/20 text-[#2D1F2F] placeholder-gray-400 focus:outline-none focus:border-[#7A0B2E] transition-colors"
          />

          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                apply("");
              }}
              className="absolute right-14 text-gray-400 hover:text-gray-600 p-1"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-1 px-3 py-1.5 bg-[#7A0B2E] hover:bg-[#5C0820] text-white text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
          >
            Search
          </button>
        </form>

        {/* Collection / Category Select Dropdown */}
        {collectionOptions && collectionOptions.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={collectionValue}
              onChange={(e) => {
                setCollectionValue(e.target.value);
                apply(undefined, undefined, e.target.value);
              }}
              className="w-full md:w-auto px-3 py-2 pr-8 text-xs bg-white border border-[#7A0B2E]/20 text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] font-medium appearance-none cursor-pointer"
            >
              <option value="">{collectionLabel}</option>
              {collectionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        )}

        {/* Status Select Dropdown */}
        {statusOptions && statusOptions.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={statusValue}
              onChange={(e) => {
                setStatusValue(e.target.value);
                apply(undefined, e.target.value, undefined);
              }}
              className="w-full md:w-auto px-3 py-2 pr-8 text-xs bg-white border border-[#7A0B2E]/20 text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E] font-medium appearance-none cursor-pointer"
            >
              <option value="">{selectLabel}</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        )}

        {/* Reset / Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#5C0820] hover:bg-[#7A0B2E]/5 border border-[#7A0B2E]/20 transition-colors shrink-0"
            title="Clear all active filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#7A0B2E]" /> Active Filters:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FDFBF7] border border-[#7A0B2E]/20 text-[#2D1F2F] text-[11px]">
              Query: <strong className="font-semibold text-[#7A0B2E]">&ldquo;{search}&rdquo;</strong>
              <button
                onClick={() => {
                  setTerm("");
                  apply("");
                }}
                className="hover:text-red-600 ml-1"
                aria-label="Remove search filter"
              >
                ×
              </button>
            </span>
          )}

          {status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FDFBF7] border border-[#7A0B2E]/20 text-[#2D1F2F] text-[11px]">
              Status: <strong className="font-semibold text-[#7A0B2E]">{status.replace(/_/g, " ")}</strong>
              <button
                onClick={() => {
                  setStatusValue("");
                  apply(undefined, "");
                }}
                className="hover:text-red-600 ml-1"
                aria-label="Remove status filter"
              >
                ×
              </button>
            </span>
          )}

          {collection && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FDFBF7] border border-[#7A0B2E]/20 text-[#2D1F2F] text-[11px]">
              Collection: <strong className="font-semibold text-[#7A0B2E]">Selected</strong>
              <button
                onClick={() => {
                  setCollectionValue("");
                  apply(undefined, undefined, "");
                }}
                className="hover:text-red-600 ml-1"
                aria-label="Remove collection filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
