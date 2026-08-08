import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Eye } from 'lucide-react';
import OrderStatusSelect from '@/components/admin/OrderStatusSelect';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: { name: true, email: true, phoneNumber: true }
      },
      _count: {
        select: { orderItems: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Orders</h2>
        <p className="text-sm text-gray-500 mt-1">Manage and fulfill customer orders</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No orders have been placed yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.split('-')[0]}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.user.name || order.user.email || order.user.phoneNumber || 'Guest'}
                  </td>
                  <td className="px-6 py-4">{order._count.orderItems} items</td>
                  <td className="px-6 py-4 font-medium text-gray-900">₹{order.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="inline-block text-gray-400 hover:text-[#0D3B66] transition-colors p-1" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
