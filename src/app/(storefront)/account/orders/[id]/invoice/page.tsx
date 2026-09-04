import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice | Myra",
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      createdAt: true,
      couponCode: true,
      discountAmount: true,
      shippingAmount: true,
      razorpayPaymentId: true,
      user: true,
      address: true,
      orderItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!order || order.userId !== userId) {
    notFound();
  }

  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate subtotal accurately based on items before discounts and shipping
  const subtotal = order.orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-neutral-100 py-10 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto bg-white shadow-xl sm:rounded-xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Actions Bar (Hidden on print) */}
        <div className="flex justify-between items-center px-8 py-4 bg-neutral-50 border-b print:hidden">
          <a href={`/account/orders/${order.id}`} className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-medium">
            ← Back to Order
          </a>
          <button 
            // We use standard inline onClick here by wrapping the print logic in a small script, or we can use a client component.
            // Since this is a server component, we can use a small script tag to handle the print.
          >
          </button>
          
          <div dangerouslySetInnerHTML={{__html: `
            <button onclick="window.print()" class="px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print Invoice
            </button>
          `}} />
        </div>

        {/* Invoice Content */}
        <div className="p-10 sm:p-14">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-b pb-10">
            <div>
              <h1 className="text-4xl font-serif text-neutral-900 tracking-tight mb-2">MYRA</h1>
              <p className="text-neutral-500 text-sm max-w-[250px]">
                Elegance redefined. Premium ethnic and contemporary wear.
              </p>
              <div className="mt-4 text-sm text-neutral-600 space-y-0.5">
                <p>123 Fashion Street, Cyber City</p>
                <p>Gurugram, Haryana, 122002</p>
                <p className="pt-2 font-medium">GSTIN: 06ABCDE1234F1Z5</p>
              </div>
            </div>
            <div className="sm:text-right">
              <h2 className="text-3xl font-light text-neutral-400 mb-2 uppercase tracking-widest">Invoice</h2>
              <p className="text-neutral-900 font-medium">#{invoiceNumber}</p>
              <p className="text-neutral-500 text-sm mt-1">{invoiceDate}</p>
              
              <div className="mt-6 inline-block bg-neutral-50 border px-4 py-3 rounded-lg sm:text-right text-left min-w-[200px]">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Payment Status</p>
                <p className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                  {order.paymentStatus}
                </p>
                {order.razorpayPaymentId && (
                  <p className="text-xs text-neutral-500 mt-2 font-mono break-all">Txn: {order.razorpayPaymentId}</p>
                )}
                {order.paymentMethod && (
                  <p className="text-xs text-neutral-500 mt-1 font-mono break-all">Method: {order.paymentMethod.replace("_", " ")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 py-10 border-b">
            <div>
              <h3 className="text-xs text-neutral-400 uppercase tracking-widest mb-4 font-semibold">Billed To</h3>
              <p className="text-neutral-900 font-medium text-lg">{order.user.name || "Customer"}</p>
              <p className="text-neutral-600 text-sm mt-1">{order.user.email}</p>
              {order.user.phoneNumber && <p className="text-neutral-600 text-sm mt-1">{order.user.phoneNumber}</p>}
            </div>
            
            <div>
              <h3 className="text-xs text-neutral-400 uppercase tracking-widest mb-4 font-semibold">Shipped To</h3>
              {order.address ? (
                <>
                  <p className="text-neutral-900 font-medium text-lg">{order.user.name || "Customer"}</p>
                  <p className="text-neutral-600 text-sm mt-1">{order.address.addressLine1}</p>
                  <p className="text-neutral-600 text-sm mt-0.5">{order.address.city}, {order.address.state} {order.address.postalCode}</p>
                  <p className="text-neutral-600 text-sm mt-0.5">{order.address.country}</p>
                  {order.address.phone && <p className="text-neutral-600 text-sm mt-1">Phone: {order.address.phone}</p>}
                </>
              ) : (
                <p className="text-neutral-500 text-sm italic">No shipping address provided.</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="py-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="pb-3 text-xs text-neutral-400 uppercase tracking-widest font-semibold">Description</th>
                  <th className="pb-3 text-xs text-neutral-400 uppercase tracking-widest font-semibold text-center w-16">Qty</th>
                  <th className="pb-3 text-xs text-neutral-400 uppercase tracking-widest font-semibold text-right w-24">Price</th>
                  <th className="pb-3 text-xs text-neutral-400 uppercase tracking-widest font-semibold text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.orderItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-5">
                      <p className="text-neutral-900 font-medium">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-neutral-500 text-xs mt-1">
                          {[item.variant.color, item.variant.size].filter(Boolean).join(" | ")}
                        </p>
                      )}
                    </td>
                    <td className="py-5 text-center text-neutral-600">{item.quantity}</td>
                    <td className="py-5 text-right text-neutral-600">₹{item.price.toFixed(2)}</td>
                    <td className="py-5 text-right text-neutral-900 font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-₹{order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>{order.shippingAmount === 0 ? "Free" : `₹${order.shippingAmount.toFixed(2)}`}</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-4 mt-4 text-lg font-medium text-neutral-900">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t text-center text-sm text-neutral-500">
            <p className="font-medium text-neutral-900 mb-1">Thank you for your business!</p>
            <p>If you have any questions concerning this invoice, contact support@myrastore.com</p>
          </div>

        </div>
      </div>
    </div>
  );
}
