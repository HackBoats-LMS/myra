"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  collection: { name: string } | null;
};

const DEBOUNCE_MS = 250;

export default function SearchBar() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = term.trim();
    debounceRef.current = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.products ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (value: string) => {
    const q = value.trim();
    setOpen(false);
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={boxRef} className="relative w-64 hidden md:block">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(term);
        }}
        className="flex items-center border border-[#B6925B]/30 focus-within:border-[#B6925B] bg-[#FAFAFA] transition-colors"
      >
        <i className="ri-search-line text-[#B6925B] pl-3" />
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search..."
          className="w-full bg-transparent px-2 py-2 text-sm text-[#4A3B2C] focus:outline-none"
        />
        {loading && <span className="px-3 text-[10px] text-[#B6925B]">…</span>}
      </form>

      {open && term.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#B6925B]/20 shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.length === 0 && !loading ? (
            <p className="px-4 py-3 text-xs text-gray-500">No matches found.</p>
          ) : (
            suggestions.map((s) => (
              <Link
                key={s.id}
                href={`/products/${s.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#FAFAFA] transition-colors"
              >
                <span className="relative w-8 h-8 shrink-0 overflow-hidden bg-gray-100">
                  {s.images?.[0] ? (
                    <Image src={s.images[0]} alt={s.name} fill sizes="32px" className="object-cover" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#4A3B2C] truncate">{s.name}</p>
                  {s.collection && (
                    <p className="text-[9px] uppercase tracking-widest text-[#B6925B]">{s.collection.name}</p>
                  )}
                </div>
                <span className="text-xs font-bold text-[#4A3B2C]">₹{s.price.toLocaleString("en-IN")}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}