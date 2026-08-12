import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import MobileMenu from "./MobileMenu";
import CartButton from "./CartButton";
import LiveSearch from "../storefront/LiveSearch";
import type { Collection } from "@/generated/prisma";

async function getCartCount(userId: string | null): Promise<number> {
  if (userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { _count: { select: { items: true } } },
    });
    return cart?._count.items ?? 0;
  }
  // Guest cart from cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("guest_cart")?.value;
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  let collections: Collection[] = [];
  let cartCount = 0;

  try {
    const results = await Promise.all([
      prisma.collection.findMany({ take: 5, orderBy: { createdAt: "asc" } }),
      getCartCount(userId),
    ]);
    collections = results[0];
    cartCount = results[1];
  } catch (error) {
    console.warn("Database unreachable in Navbar, falling back to empty state:", error);
  }

  return (
    <nav className="w-full bg-white border-b border-[#B6925B]/20 flex items-center justify-between px-6 md:px-8 py-4 relative z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/displaypics/malllogo.png"
          alt="Myra Shopping Mall Logo"
          width={150}
          height={50}
          className="object-contain h-10 w-auto"
        />
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="/collections" className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] transition-colors">
          All Products
        </Link>
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.slug}`}
            className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:text-[#B6925B] transition-colors"
          >
            {c.name.toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Global Search Bar */}
      <LiveSearch />

      {/* Desktop Action Icons */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href={session ? "/account" : "/login"}
          className="flex flex-col items-center gap-1 text-[#4A3B2C] hover:text-[#B6925B] transition-colors"
        >
          <i className="ri-user-line text-[22px] leading-none stroke-[1.5]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">account</span>
        </Link>

        <CartButton cartCount={cartCount} />

        <Link
          href="/wishlist"
          className="flex flex-col items-center gap-1 text-[#4A3B2C] hover:text-[#B6925B] transition-colors"
        >
          <i className="ri-heart-line text-[22px] leading-none stroke-[1.5]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">wishlist</span>
        </Link>
      </div>

      {/* Mobile Hamburger Menu */}
      <MobileMenu collections={collections} isLoggedIn={!!session} cartCount={cartCount} />
    </nav>
  );
}
