import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen flex bg-white">
      {/* Left side: The Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-8 left-8">
          <Image src="/displaypics/malllogo.png" alt="Myra Logo" width={120} height={40} className="object-contain h-8 w-auto" />
        </Link>
        <div className="w-full max-w-sm mt-12">
          {children}
        </div>
      </div>
      
      {/* Right side: The Promotional Image */}
      <div className="hidden lg:flex w-1/2 relative bg-[#F7F1E6] items-center justify-center overflow-hidden">
        <Image 
          src="/displaypics/dressesthatdefine.png" 
          alt="Myra Shopping Mall" 
          fill 
          priority
          className="object-cover absolute inset-0 z-0" 
        />
        <div className="absolute inset-0 bg-black/10 z-10" />
      </div>
    </div>
  );
}
