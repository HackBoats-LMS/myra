import Link from "next/link";
import Image from "next/image";

export default function BridalBannerSection() {
  return (
    <Link href="/collections/bridal" className="block w-full relative h-[180px] md:h-[600px] overflow-hidden cursor-pointer">
      <Image src="/displaypics/bribal poster.png" alt="Bridal Collection" fill sizes="100vw" quality={100} className="object-cover object-center" />
    </Link>
  );
}
