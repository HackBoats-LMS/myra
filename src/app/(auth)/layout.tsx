import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen flex bg-[#FAFAFA]">
      {/* Left side: The Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-8 left-16">
          <Image src="/displaypics/myralogo.png" alt="Myra Logo" width={180} height={60} className="object-contain h-12 w-auto" />
        </Link>
        <div className="w-full max-w-sm mt-12">
          {children}
        </div>
      </div>
      
      {/* Right side: The Promotional Image */}
      <div className="hidden lg:flex w-1/2 relative bg-[#F7F1E6] items-center justify-center overflow-hidden">
        <Image 
          src="/login/login_right1.png" 
          alt="Myra Shopping Mall" 
          fill 
          priority
          quality={100}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover absolute inset-0 z-0" 
        />
        <div className="absolute inset-0 bg-black/10 z-10" />
      </div>
    </div>
  );
}
