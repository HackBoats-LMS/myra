export default function StorefrontLoading() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#7A0B2E]/30 border-t-[#7A0B2E] rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">Loading…</p>
      </div>
    </div>
  );
}
