"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  // Don't show breadcrumbs on auth pages, cart, checkout, or account
  if (["login", "signup", "cart", "checkout", "account"].includes(paths[0])) {
    return null;
  }

  const buildPath = (index: number) => {
    return "/" + paths.slice(0, index + 1).join("/");
  };

  const formatSegment = (segment: string) => {
    return segment
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto whitespace-nowrap">
      <ol className="flex items-center space-x-2 text-xs md:text-sm text-gray-500">
        <li>
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
        </li>
        
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const href = buildPath(index);

          return (
            <li key={path} className="flex items-center">
              <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 mx-2 text-gray-400 flex-shrink-0" />
              {isLast ? (
                <span className="text-gray-900 font-medium truncate max-w-[150px] md:max-w-[300px]" aria-current="page">
                  {formatSegment(path)}
                </span>
              ) : (
                <Link href={href} className="hover:text-gray-900 transition-colors truncate max-w-[100px] md:max-w-[200px]">
                  {formatSegment(path)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
