export default function StorefrontLoading() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#B6925B]/30 border-t-[#B6925B] rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Loading…</p>
      </div>
    </div>
  );
}
