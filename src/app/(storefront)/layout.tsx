import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
