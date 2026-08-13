import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import MobileMenu from "./MobileMenu";
import CartButton from "./CartButton";
import WishlistButton from "./WishlistButton";
import NavMenu from "./NavMenu";
import { NAV_LINKS } from "@/lib/navigation";
import { getWishlistCount } from "@/actions/wishlist";

async function getCartCount(userId: string | null): Promise<number> {
  if (userId) {
    const result = await prisma.cartItem.aggregate({
      where: { cart: { userId } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
  // Guest cart from cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("guest_cart")?.value;
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  let cartCount = 0;
  let wishlistCount = 0;

  try {
    cartCount = await getCartCount(userId);
    wishlistCount = await getWishlistCount();
  } catch (error) {
    console.warn("Database unreachable in Navbar, falling back to empty state:", error);
  }

  return (
    <nav className="w-full bg-white border-b border-[#B6925B]/20 flex items-center px-4 md:px-6 lg:px-8 py-3 relative z-50">
      {/* Logo (left) */}
      <div className="flex-1 flex items-center justify-start">
        <Link href="/" className="flex items-center">
          <Image
            src="/displaypics/malllogo.png"
            alt="Myra Shopping Mall Logo"
            width={150}
            height={50}
            priority
            className="object-contain h-12 md:h-14 w-auto"
          />
        </Link>
      </div>

      {/* Desktop Navigation with Dropdowns (centered) */}
      <NavMenu links={NAV_LINKS} />

      {/* Desktop Action Icons (right) */}
      <div className="flex-1 hidden md:flex items-center justify-end gap-6 lg:gap-8">
        <Link
          href={session ? "/account" : "/login"}
          className="flex flex-col items-center gap-1 text-[#4A3B2C] hover:text-[#B6925B] transition-colors"
        >
          <i className="ri-user-line text-[22px] leading-none stroke-[1.5]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">account</span>
        </Link>

        <CartButton cartCount={cartCount} />

        <WishlistButton wishlistCount={wishlistCount} />
      </div>

      {/* Mobile Hamburger Menu */}
      <MobileMenu links={NAV_LINKS} isLoggedIn={!!session} cartCount={cartCount} wishlistCount={wishlistCount} />
    </nav>
  );
}
