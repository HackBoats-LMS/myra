"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small timeout to animate in smoothly
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white border border-[#7A0B2E]/20 p-6 shadow-2xl z-[60] animate-slide-in-right space-y-4">
      <div className="flex items-start justify-between">
        <h4 className="text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest">Cookie Notice</h4>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-[#2D1F2F] focus:outline-none transition-colors flex items-center justify-center"
        >
          <i className="ri-close-line text-base leading-none" />
        </button>
      </div>

      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold leading-relaxed">
        We use cookies to secure user sessions and manage guest shopping carts. By clicking &ldquo;Accept All&rdquo;, you agree to our use of session cookies.
      </p>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAccept}
          className="flex-1 bg-[#2D1F2F] hover:bg-[#220510] text-white py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors text-center"
        >
          Accept All
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-1 bg-white hover:bg-[#F5EFE6] text-[#2D1F2F] py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors border border-[#7A0B2E]/20 text-center"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
