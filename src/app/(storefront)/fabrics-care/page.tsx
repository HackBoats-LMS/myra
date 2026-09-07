import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Fabrics Care Guide | Myra Shopping Mall",
  description:
    "Expert care and maintenance guide for pure silk sarees, Banarasi weaves, Kanjeevaram silks, cottons, and designer ethnic wear.",
};


const FABRIC_GUIDES = [
  {
    title: "Pure Silk & Kanjeevaram Sarees",
    tagline: "Preserve the luster and heritage zari work of pure silk",
    icon: "sparkles",
    tips: [
      "Dry clean only for the first 2–3 washes to safeguard pure silk threads and genuine zari luster.",
      "Never spray perfumes, deodorants, or hairsprays directly onto silk or metallic zari embroideries.",
      "Store sarees wrapped in breathable unbleached pure cotton or muslin fabric; avoid airtight plastic bags.",
      "Refold your silk sarees every 3–4 months along different crease lines to prevent fabric cracking at the folds.",
      "Iron on the reverse side using medium-low heat or place a thin cotton pressing cloth over the silk.",
      "Air out your silks in a cool, shaded room once every six months—never place under direct scorching sunlight.",
    ],
  },
  {
    title: "Banarasi & Embroidered Lehengas",
    tagline: "Safeguard heavy hand-embroidery, sequins, and intricate brocades",
    icon: "crown",
    tips: [
      "Always opt for professional commercial dry cleaning by specialists experienced in bridal and heritage weaves.",
      "Keep silica gel packets inside the storage wardrobe to absorb excess ambient humidity and protect zari from tarnishing.",
      "Never hang heavy embroidered lehengas or dupattas on wire hangers, as the weight can stretch the fabric; store flat in breathable garment bags.",
      "If zari darkens naturally over years, gently wipe with dry soft muslin—do not apply water, soaps, or detergents.",
    ],
  },
  {
    title: "Fine Cotton, Chanderi & Linen",
    tagline: "Maintain crispness, vibrant natural dyes, and breathable comfort",
    icon: "leaf",
    tips: [
      "Wash cottons separately in cold water with mild, pH-neutral liquid detergent.",
      "Do not wring vigorously; gently squeeze out water and dry in a well-ventilated, shaded area.",
      "Starch lightly if a crisp drape is desired, especially for South Cotton and Mangalagiri weaves.",
      "Iron while slightly damp for effortless wrinkle removal and an immaculate crisp finish.",
    ],
  },
  {
    title: "Georgette, Chiffon & Organza",
    tagline: "Care for delicate, sheer, and feather-light party wear",
    icon: "feather",
    tips: [
      "Hand wash with extreme gentleness in cold water with gentle liquid soap, or dry clean for embroidered varieties.",
      "Do not tumble dry; lay flat on a clean dry towel away from direct heat or sun.",
      "Use steam iron on the lowest delicate synthetic setting with a protective barrier cloth.",
      "Be mindful of jewelry and accessories with sharp edges to prevent snagging delicate organza threads.",
    ],
  },
];

export default function FabricsCarePage() {
  return (
    <div className="w-full bg-[#F5EFE6] min-h-screen py-10 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#7A0B2E]">
            Preserve Your Timeless Wardrobe
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#2D1F2F] mt-2 mb-4 tracking-wide">
            Fabrics Care Guide
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-sans leading-relaxed">
            Every creation at Myra Shopping Mall is handcrafted with exceptional craftsmanship. Follow our curated fabric care recommendations to maintain the pristine beauty, color, and sheen of your heirloom garments.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {FABRIC_GUIDES.map((guide, idx) => (
            <div
              key={idx}
              className="bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-[#7A0B2E]/15 flex flex-col justify-between"
            >
              <div>
                <div className="inline-block px-3 py-1 bg-[#FAF6F0] border border-[#7A0B2E]/20 text-[#7A0B2E] text-xs font-bold uppercase tracking-wider rounded mb-3">
                  Fabric Advice
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F] mb-1">
                  {guide.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A0B2E] font-medium mb-5">
                  {guide.tagline}
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {guide.tips.map((tip, tipIdx) => (
                    <li key={tipIdx} className="flex items-start gap-2.5">
                      <span className="text-[#7A0B2E] mt-1 shrink-0 font-bold">&#10003;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Handcrafted with Care</span>
                <span>Myra Mall Certified</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Consultation Banner */}
        <div className="mt-12 bg-white border border-[#7A0B2E]/20 p-8 rounded-lg text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2D1F2F]">
            Need Personal Advice on a Specific Garment?
          </h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Our experienced in-store fabric artisans are delighted to guide you with tailored maintenance and storage advice for your sarees and custom bridal pieces.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="https://wa.me/919177751481?text=Hi%2C%20I%20have%20a%20question%20regarding%20fabric%20care%20for%20my%20saree"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-[#1EBE5D] transition-colors"
            >
              Ask on WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7A0B2E] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-[#5C0820] transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
