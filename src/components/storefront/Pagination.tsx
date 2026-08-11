import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
    <div className="flex items-center justify-center space-x-6 py-12 border-t border-gray-100">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-md transition-all"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 border border-gray-100 rounded-md cursor-not-allowed">
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </span>
      )}

      {/* Page Info */}
      <span className="text-sm font-medium text-gray-500">
        Page <span className="text-gray-900 font-semibold">{currentPage}</span> of{" "}
        <span className="text-gray-900 font-semibold">{totalPages}</span>
      </span>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-md transition-all"
        >
          <span>Next</span>
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 border border-gray-100 rounded-md cursor-not-allowed">
          <span>Next</span>
          <ChevronRightIcon className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
