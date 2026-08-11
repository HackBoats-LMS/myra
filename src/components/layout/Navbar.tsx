import Link from "next/link";
import Image from "next/image";
import { UserIcon, ShoppingBagIcon, HeartIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import MobileMenu from "./MobileMenu";

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

  const [collections, cartCount] = await Promise.all([
    prisma.collection.findMany({ take: 5, orderBy: { createdAt: "asc" } }),
    getCartCount(userId),
  ]);

  return (
    <nav className="w-full bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 py-4 relative z-50">
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
        <Link href="/collections" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
          All Products
        </Link>
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.slug}`}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {c.name.toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Global Search Bar */}
      <form action="/search" method="GET" className="hidden lg:flex items-center relative max-w-xs w-64">
        <input
          name="q"
          placeholder="Search products..."
          className="w-full bg-gray-50 border border-gray-200 rounded-full py-1.5 pl-4 pr-10 text-xs focus:outline-none focus:border-[#0D3B66] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
        />
        <button type="submit" className="absolute right-3 text-gray-400 hover:text-gray-600">
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>
      </form>

      {/* Desktop Action Icons */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href={session ? "/account" : "/login"}
          className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <UserIcon className="w-[22px] h-[22px] stroke-[1.5]" />
          <span className="text-[10px] capitalize text-gray-600">account</span>
        </Link>

        <Link
          href="/cart"
          className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors relative"
        >
          <div className="relative">
            <ShoppingBagIcon className="w-[22px] h-[22px] stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-[#B03138] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] capitalize text-gray-600">cart</span>
        </Link>

        <Link
          href="/wishlist"
          className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <HeartIcon className="w-[22px] h-[22px] stroke-[1.5]" />
          <span className="text-[10px] capitalize text-gray-600">wishlist</span>
        </Link>
      </div>

      {/* Mobile Hamburger Menu */}
      <MobileMenu collections={collections} isLoggedIn={!!session} cartCount={cartCount} />
    </nav>
  );
}
