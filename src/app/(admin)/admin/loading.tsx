export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#7A0B2E]/20 pb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200" />
          <div className="h-4 w-32 bg-gray-100 mt-2" />
        </div>
        <div className="h-9 w-28 bg-gray-200" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 border border-[#7A0B2E]/20 shadow-sm space-y-3">
            <div className="h-3 w-20 bg-gray-200" />
            <div className="h-7 w-24 bg-gray-300" />
            <div className="h-3 w-16 bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#7A0B2E]/20 shadow-sm p-6 space-y-4">
        <div className="h-5 w-36 bg-gray-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
