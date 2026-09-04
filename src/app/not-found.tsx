import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-md">
        <p className="font-serif text-7xl text-[#7A0B2E]">404</p>
        <h1 className="text-2xl md:text-3xl font-serif text-[#2D1F2F] tracking-wide">Page Not Found</h1>
        <p className="text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/"
            className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-none"
          >
            Back to Home
          </Link>
          <Link
            href="/collections"
            className="border border-[#7A0B2E]/40 text-[#2D1F2F] hover:bg-[#7A0B2E] hover:text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-none"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
