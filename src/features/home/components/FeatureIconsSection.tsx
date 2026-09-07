import { Truck, Award, ShieldCheck, Headphones } from "lucide-react";

export default function FeatureIconsSection() {
  return (
    <section className="w-full bg-transparent py-8 md:py-16 border-b border-[#7A0B2E]/20">
      <div className="max-w-5xl mx-auto flex justify-between px-2 md:px-8">
        <div className="flex flex-col items-center gap-2 md:gap-4">
          <Truck className="w-6 h-6 md:w-8 md:h-8 text-[#7A0B2E] stroke-[1.5]" />
          <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">Complimentary<br />Shipping</span>
        </div>
        <div className="flex flex-col items-center gap-2 md:gap-4">
          <Award className="w-6 h-6 md:w-8 md:h-8 text-[#7A0B2E] stroke-[1.5]" />
          <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">Premium<br />Quality</span>
        </div>
        <div className="flex flex-col items-center gap-2 md:gap-4">
          <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-[#7A0B2E] stroke-[1.5]" />
          <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">Secure<br />Checkout</span>
        </div>
        <div className="flex flex-col items-center gap-2 md:gap-4">
          <Headphones className="w-6 h-6 md:w-8 md:h-8 text-[#7A0B2E] stroke-[1.5]" />
          <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest text-center font-bold">24/7<br />Support</span>
        </div>
      </div>
    </section>
  );
}
