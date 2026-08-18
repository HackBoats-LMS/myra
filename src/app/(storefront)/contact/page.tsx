"use client";
import { useState } from "react";
import { sendContactMessage } from "@/actions/contact";
import { useToast } from "@/components/ui/Toast";

export default function ContactPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await sendContactMessage(formData);
      toast.success("Thank you! Your message has been sent successfully.");
      e.currentTarget.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send your message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen rounded-none">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-[#4A3B2C] tracking-wide">Contact Us</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Get in touch with our team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">
          {/* Contact Info */}
          <div className="space-y-8 bg-white border border-[#B6925B]/20 p-8 shadow-sm rounded-none">
            <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Reach Out</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Have questions regarding sizing, shipping, or returns? Drop us a message, 
              and our concierge team will get back to you within 24 hours.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm text-[#4A3B2C]">
                <i className="ri-mail-line text-[#B6925B] text-lg" />
                <span>support@myra.com</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#4A3B2C]">
                <i className="ri-phone-line text-[#B6925B] text-lg" />
                <span>+91 1800 123 4567</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#4A3B2C]">
                <i className="ri-map-pin-line text-[#B6925B] text-lg" />
                <span>Myra Shopping Mall, MG Road, Bangalore, India</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 border border-[#B6925B]/20 shadow-sm rounded-none">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
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
                  name="subject"
                  className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider mb-2">
                  Message
                </label>
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="w-full bg-transparent border border-[#B6925B]/30 px-4 py-3 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white py-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4 rounded-none"
              >
                {loading && <i className="ri-loader-4-line animate-spin text-sm" />}
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
