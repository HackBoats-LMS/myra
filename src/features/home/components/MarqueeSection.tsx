export default function MarqueeSection() {
  return (
    <div className="w-full bg-[#B6925B] py-3 overflow-hidden flex items-center border-y border-[#9c7d4e]">
      <div className="whitespace-nowrap flex gap-12 text-white font-serif text-[10px] md:text-xs tracking-widest uppercase animate-marquee opacity-90">
        <span>✧ Premium Fitting</span>
        <span>✧ Secure Shopping</span>
        <span>✧ Unmatched Offers</span>
        <span>✧ Easy Returns</span>
        <span>✧ Premium Quality</span>
        <span>✧ Secure Shopping</span>
        <span>✧ Exclusive Offers</span>
        <span>✧ Premium Fitting</span>
        <span>✧ Secure Shopping</span>
        <span>✧ Unmatched Offers</span>
      </div>
    </div>
  );
}
