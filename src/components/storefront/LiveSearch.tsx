"use client";
import { useReducer, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[] | null;
  collection?: { name: string | null } | null;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
}

type SearchAction =
  | { type: "TYPING"; query: string }
  | { type: "SUCCESS"; results: SearchResult[] }
  | { type: "LOADING" }
  | { type: "RESET" }
  | { type: "CLOSE" }
  | { type: "OPEN" };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "TYPING":
      return { ...state, query: action.query, isOpen: true };
    case "LOADING":
      return { ...state, isLoading: true };
    case "SUCCESS":
      return { ...state, isLoading: false, results: action.results };
    case "RESET":
      return { query: "", results: [], isLoading: false, isOpen: false };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "OPEN":
      return { ...state, isOpen: true };
    default:
      return state;
  }
}

export default function LiveSearch() {
  const [state, dispatch] = useReducer(searchReducer, {
    query: "",
    results: [],
    isLoading: false,
    isOpen: false,
  });
  const { query, results, isLoading, isOpen } = state;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        dispatch({ type: "CLOSE" });
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        dispatch({ type: "SUCCESS", results: [] });
        return;
      }

      dispatch({ type: "LOADING" });
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        dispatch({ type: "SUCCESS", results: data.products || [] });
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        dispatch({ type: "SUCCESS", results: [] });
      }
    };

    const timer = setTimeout(fetchSuggestions, 300); // Debounce 300ms
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      dispatch({ type: "CLOSE" });
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    dispatch({ type: "RESET" });
  };

  return (
    <div ref={wrapperRef} className="hidden lg:block relative max-w-xs w-64 z-50">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => dispatch({ type: "TYPING", query: e.target.value })}
          onFocus={() => dispatch({ type: "OPEN" })}
          placeholder="Search products..."
          className="w-full bg-[#FAFAFA] border border-[#B6925B]/20 rounded-none py-2 pl-4 pr-10 text-[10px] uppercase tracking-widest font-bold focus:outline-none focus:border-[#B6925B] focus:bg-white focus:ring-1 focus:ring-[#B6925B] transition-all text-[#4A3B2C] placeholder-gray-400"
        />
        
        {query ? (
          <button type="button" onClick={handleClear} className="absolute right-3 text-[#B6925B] hover:text-[#4A3B2C] p-1 transition-colors flex items-center justify-center">
            <i className="ri-close-line text-base leading-none" />
          </button>
        ) : (
          <button type="submit" className="absolute right-3 text-[#B6925B] hover:text-[#4A3B2C] p-1 transition-colors flex items-center justify-center">
            <i className="ri-search-line text-base leading-none" />
          </button>
        )}
      </form>

      {/* Dropdown Results */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl border border-[#B6925B]/20 overflow-hidden">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Searching...</div>
          ) : results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => dispatch({ type: "CLOSE" })}
                  className="flex items-center gap-3 p-3 hover:bg-[#FAFAFA] transition-colors border-b border-[#B6925B]/10 last:border-0"
                >
                  <div className="relative w-10 h-10 bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#4A3B2C] truncate">{product.name}</p>
                    {product.collection && (
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#B6925B] truncate mt-0.5">{product.collection.name}</p>
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#4A3B2C]">
                    ₹{product.price.toFixed(2)}
                  </div>
                </Link>
              ))}
              <div 
                onClick={handleSubmit} 
                className="p-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] bg-[#FAFAFA] hover:bg-white hover:text-[#4A3B2C] cursor-pointer transition-colors border-t border-[#B6925B]/20"
              >
                View all results for &ldquo;{query}&rdquo;
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
