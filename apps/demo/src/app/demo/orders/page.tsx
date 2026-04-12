'use client';

import { ORDERS } from '@/lib/mock-data';
import { useDemoStore, useHasHydrated } from '@/store/demo-store';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Truck, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const { advanceOrderStatus, getOrderStatus } = useDemoStore();
  const hasHydrated = useHasHydrated();

  const statusOf = (id: string) => hasHydrated ? getOrderStatus(id) : (ORDERS.find(o => o.id === id)?.status ?? 'PENDING');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        sub="Today's order management"
      />

      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: 'Total Orders', value: ORDERS.length, color: 'text-slate-900' },
          { label: 'In Progress',  value: ORDERS.filter(o => !['DELIVERED', 'CANCELLED'].includes(statusOf(o.id))).length, color: 'text-blue-600' },
          { label: 'Delivered',    value: ORDERS.filter(o => statusOf(o.id) === 'DELIVERED').length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ORDERS.map((order) => {
              const status = statusOf(order.id);
              const isDone = status === 'DELIVERED';
              return (
                <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${isDone ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      #{order.id.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{order.patient}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                  <td className="px-5 py-3.5">
                    {order.delivery ? (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Truck className="w-3.5 h-3.5" /> {order.delivery}
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{formatCurrency(order.total)}</td>
                  <td className="px-5 py-3.5 text-slate-500">{order.time}</td>
                  <td className="px-5 py-3.5">
                    {!isDone && (
                      <button
                        onClick={() => advanceOrderStatus(order.id)}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Advance <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
