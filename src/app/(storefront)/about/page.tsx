import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Myra Shopping Mall",
  description: "Learn more about the heritage and values of Myra Shopping Mall.",
};

export default function AboutPage() {
  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-[#4A3B2C] tracking-wide">Our Story</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Heritage, Quality, & Passion</p>
        </div>

        <div className="prose prose-md text-gray-600 mx-auto space-y-6 leading-relaxed">
          <p>
            Founded in 2026, <strong>Myra Shopping Mall</strong> represents the peak of modern lifestyle 
            curation. We believe that style is a reflection of one&rsquo;s journey, and our mission is to offer 
            timeless, high-quality fashion that adapts seamlessly to your lifestyle.
          </p>

          <p>
            Every piece in our catalog is handpicked by our expert design team, ensuring that we only provide 
            apparel and accessories that meet our strict standards for durability, aesthetic alignment, and comfort. 
            We work closely with ethical manufacturers to ensure that our footprint remains low while quality remains high.
          </p>

          <h3 className="text-xl font-serif text-[#4A3B2C] pt-6">Our Philosophy</h3>
          <p>
            We stand on three core pillars: <strong>Aesthetic Simplicity</strong>, <strong>Premium Craftsmanship</strong>, and <strong>Ethical Production</strong>. 
            We believe that wardrobe building should be intentional. Rather than following fast-fashion cycles, we focus 
            on capsule elements that can be styled effortlessly for years.
          </p>

          <div className="bg-white p-8 border border-[#B6925B]/20 flex flex-col md:flex-row gap-8 mt-12 justify-around text-center shadow-sm">
            <div>
              <h4 className="text-xl font-serif text-[#4A3B2C]">5k+</h4>
              <p className="text-xs text-[#B6925B] uppercase tracking-widest mt-2 font-bold">Delighted Clients</p>
            </div>
            <div>
              <h4 className="text-xl font-serif text-[#4A3B2C]">100%</h4>
              <p className="text-xs text-[#B6925B] uppercase tracking-widest mt-2 font-bold">Ethically Sourced</p>
            </div>
            <div>
              <h4 className="text-xl font-serif text-[#4A3B2C]">Complimentary</h4>
              <p className="text-xs text-[#B6925B] uppercase tracking-widest mt-2 font-bold">Shipping Worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
