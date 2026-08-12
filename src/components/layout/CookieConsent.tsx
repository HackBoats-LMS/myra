"use client";
import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white border border-gray-200 p-6 rounded-lg shadow-2xl z-50 animate-slide-in-right space-y-4">
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Cookie Notice</h4>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed font-normal">
        We use cookies to secure user sessions and manage guest shopping carts. By clicking &ldquo;Accept All&rdquo;, you agree to our use of session cookies.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          className="flex-1 bg-[#0D3B66] hover:bg-[#082a4d] text-white py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors text-center"
        >
          Accept All
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-gray-200 text-center"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
