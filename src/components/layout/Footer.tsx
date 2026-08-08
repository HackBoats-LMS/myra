import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-gray-900">MYRA</h3>
          <p className="text-sm text-gray-500">Premium apparel and modern fashion. Elevate your everyday style with our curated collections.</p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">Shop</h4>
          <div className="flex flex-col space-y-2 text-sm text-gray-500">
            <Link href="/collections" className="hover:text-gray-900 transition-colors">All Products</Link>
            <Link href="/collections/women" className="hover:text-gray-900 transition-colors">Women's Collection</Link>
            <Link href="/collections/kids" className="hover:text-gray-900 transition-colors">Kids' Collection</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">Support</h4>
          <div className="flex flex-col space-y-2 text-sm text-gray-500">
            <Link href="#" className="hover:text-gray-900 transition-colors">Contact Us</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">Shipping & Returns</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">FAQ</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">Legal</h4>
          <div className="flex flex-col space-y-2 text-sm text-gray-500">
            <Link href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-6 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Myra Shopping Mall. All rights reserved.</p>
      </div>
    </footer>
  );
}
