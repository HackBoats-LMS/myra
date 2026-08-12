"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      toast.success("Thank you! Your message has been sent successfully.");
      (e.target as HTMLFormElement).reset();
    }, 1200);
  };

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-[#4A3B2C] tracking-wide">Contact Us</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Get in touch with our team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">
          {/* Contact Info */}
          <div className="space-y-8 bg-white border border-[#B6925B]/20 p-8 shadow-sm">
            <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Reach Out</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Have questions regarding sizing, shipping, or returns? Drop us a message, 
              and our concierge team will get back to you within 24 hours.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm text-[#4A3B2C]">
                <EnvelopeIcon className="w-5 h-5 text-[#B6925B]" />
                <span>support@myra.com</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#4A3B2C]">
                <PhoneIcon className="w-5 h-5 text-[#B6925B]" />
                <span>+91 1800 123 4567</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#4A3B2C]">
                <MapPinIcon className="w-5 h-5 text-[#B6925B]" />
                <span>Myra Shopping Mall, MG Road, Bangalore, India</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 border border-[#B6925B]/20 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                  Subject
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white py-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
