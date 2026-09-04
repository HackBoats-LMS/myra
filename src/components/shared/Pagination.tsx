import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    // If the base URL already has parameters, append with &, otherwise ?
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  };

  return (
    <div className="flex items-center justify-center space-x-6 py-12 border-t border-[#7A0B2E]/20">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] hover:text-[#7A0B2E] border border-[#7A0B2E]/30 hover:border-[#2D1F2F] rounded-none transition-all bg-white"
        >
          <ChevronLeft className="w-4 h-4 text-[#7A0B2E]" />
          <span>Previous</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 border border-[#7A0B2E]/10 rounded-none cursor-not-allowed bg-white">
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </span>
      )}

      {/* Page Info */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">
        Page <span className="text-[#7A0B2E] font-bold">{currentPage}</span> of{" "}
        <span className="text-[#7A0B2E] font-bold">{totalPages}</span>
      </span>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] hover:text-[#7A0B2E] border border-[#7A0B2E]/30 hover:border-[#2D1F2F] rounded-none transition-all bg-white"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 text-[#7A0B2E]" />
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-300 border border-[#7A0B2E]/10 rounded-none cursor-not-allowed bg-white">
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
