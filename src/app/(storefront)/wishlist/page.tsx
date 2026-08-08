import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProductCard from "@/components/storefront/ProductCard";
import { redirect } from "next/navigation";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any)?.id) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight">Wishlist</h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">{wishlist?.items.length || 0} items saved</p>
      </div>

      {!wishlist || wishlist.items.length === 0 ? (
        <div className="text-center text-gray-500 py-20">You haven't saved any items yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {wishlist.items.map((item: any) => (
            <ProductCard key={item.id} product={item.product} isWishlisted={true} />
          ))}
        </div>
      )}
    </div>
  );
}
