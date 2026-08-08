import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, User, ShoppingBag, Heart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  
  const collections = await prisma.collection.findMany({
    take: 5,
    orderBy: { createdAt: 'asc' }
  });

  return (
    <nav className="w-full bg-white border-b border-gray-100 flex items-center justify-between px-8 py-4">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        {/* The user's logo image includes the text, so we removed the HTML text */}
        <Image 
          src="/displaypics/malllogo.png" 
          alt="Myra Shopping Mall Logo" 
          width={150} 
          height={50} 
          className="object-contain h-10 w-auto" 
        />
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="/collections" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">All Products</Link>
        {collections.map(c => (
          <Link key={c.id} href={`/collections/${c.slug}`} className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            {c.name.toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-8">
        <Link href={session ? "/account" : "/login"} className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors">
          <User className="w-[22px] h-[22px] stroke-[1.5]" />
          <span className="text-[10px] capitalize text-gray-600">account</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors">
          <ShoppingBag className="w-[22px] h-[22px] stroke-[1.5]" />
          <span className="text-[10px] capitalize text-gray-600">cart</span>
        </Link>
        <Link href="/wishlist" className="flex flex-col items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors">
          <Heart className="w-[22px] h-[22px] stroke-[1.5]" />
          <span className="text-[10px] capitalize text-gray-600">wishlist</span>
        </Link>
      </div>
    </nav>
  );
}
