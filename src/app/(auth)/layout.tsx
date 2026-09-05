import Image from "next/image";
import Link from "next/link";
import MyraLogo from "@/components/shared/MyraLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-[#F5EFE6]">
      {/* Mobile Top Image Banner (hidden on lg) */}
      <div className="lg:hidden w-full h-[40vh] relative flex items-center justify-center">
        <Image 
          src="/login/login_right1.png" 
          alt="Myra Shopping Mall" 
          fill 
          priority
          quality={100}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover" 
        />
        <div className="absolute inset-0 bg-black/10 z-10" />
        <Link href="/" className="absolute top-8 z-20">
          <MyraLogo className="h-10 sm:h-12 w-auto drop-shadow-md brightness-0 invert" />
        </Link>
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-[#F5EFE6] rounded-t-3xl lg:rounded-none -mt-8 lg:mt-0 z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] lg:shadow-none min-h-[60vh] lg:min-h-screen">
        <Link href="/" className="hidden lg:block absolute top-8 left-16">
          <MyraLogo className="h-12 md:h-14 w-auto" />
        </Link>
        <div className="w-full max-w-sm mt-2 lg:mt-12">
          <div className="lg:hidden flex justify-center mb-6">
            <Link href="/" aria-label="Myra Home">
              <MyraLogo className="h-10 sm:h-12 w-auto" />
            </Link>
          </div>
          {children}
        </div>
      </div>
      
      {/* Desktop Right Promotional Image */}
      <div className="hidden lg:flex w-1/2 relative bg-[#F5EFE6] items-center justify-center overflow-hidden">
        <Image 
          src="/login/login_right1.png" 
          alt="Myra Shopping Mall" 
          fill 
          priority
          quality={100}
          sizes="50vw"
          className="object-cover absolute inset-0 z-0" 
        />
        <div className="absolute inset-0 bg-black/10 z-10" />
      </div>
    </div>
  );
}
