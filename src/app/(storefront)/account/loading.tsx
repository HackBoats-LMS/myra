export default function AccountLoading() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200" />
          <div className="h-4 w-24 bg-gray-100 mt-2" />
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200" />
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-[#B6925B]/20 shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-[#B6925B]/10 pb-4">
                <div className="h-4 w-24 bg-gray-200" />
                <div className="h-4 w-20 bg-gray-200" />
                <div className="h-4 w-16 bg-gray-200" />
                <div className="h-4 w-20 bg-gray-200" />
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-20 bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200" />
                  <div className="h-3 w-16 bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
