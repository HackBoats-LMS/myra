import Navbar from "@/components/layout/Navbar";
import { validateEnv } from "@/lib/env";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  validateEnv();
  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
