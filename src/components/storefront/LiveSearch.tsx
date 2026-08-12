"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[] | null;
  collection?: { name: string | null } | null;
}

export default function LiveSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300); // Debounce 300ms
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="hidden lg:block relative max-w-xs w-64 z-50">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products..."
          className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-4 pr-10 text-xs focus:outline-none focus:border-[#0D3B66] focus:bg-white focus:ring-1 focus:ring-[#0D3B66]/20 transition-all text-gray-900 placeholder-gray-400"
        />
        
        {query ? (
          <button type="button" onClick={handleClear} className="absolute right-3 text-gray-400 hover:text-gray-600 p-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        ) : (
          <button type="submit" className="absolute right-3 text-gray-400 hover:text-gray-600 p-1">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    {product.collection && (
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 truncate">{product.collection.name}</p>
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#0D3B66]">
                    ₹{product.price.toFixed(2)}
                  </div>
                </Link>
              ))}
              <div 
                onClick={handleSubmit} 
                className="p-3 text-center text-xs font-semibold text-[#0D3B66] bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                View all results for &ldquo;{query}&rdquo;
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
