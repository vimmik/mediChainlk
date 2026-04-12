'use client';

import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { BILL_HEADERS } from '@/lib/mock-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Clock, CreditCard, DollarSign, Download, Eye, Percent, Truck } from 'lucide-react';
import { useState } from 'react';

const PAYMENT_BADGE: Record<string, 'blue' | 'purple' | 'gray'> = {
  PayHere: 'blue',
  WEBXPAY: 'purple',
};

export default function BillingPage() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const todayRevenue = BILL_HEADERS
    .filter((b) => b.billDate === '2026-04-04' && b.isPaid)
    .reduce((sum, b) => sum + b.grandTotal, 0);

  const pendingTotal = BILL_HEADERS
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + b.netPrice, 0);

  const completedCount = BILL_HEADERS.filter((b) => b.isPaid).length;

  const totalDiscount = BILL_HEADERS.reduce((s, b) => s + b.discountAmount, 0);

  const payherePct = Math.round(
    (BILL_HEADERS.filter(b => b.paymentMethod === 'PayHere').length / BILL_HEADERS.filter(b => b.isPaid).length) * 100
  );

  const filtered = BILL_HEADERS.filter((b) => {
    if (filter === 'paid') return b.isPaid;
    if (filter === 'pending') return !b.isPaid;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Billing & Invoices"
        sub="Colombo Central Pharmacy · April 2026"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          sub="Paid invoices today"
          icon={DollarSign}
          color="green"
          trend={{ value: '+12% vs yesterday', up: true }}
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(pendingTotal)}
          sub={`${BILL_HEADERS.filter(b => !b.isPaid).length} invoices pending`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Discounts Given"
          value={formatCurrency(totalDiscount)}
          sub={`${BILL_HEADERS.filter(b => b.discountAmount > 0).length} discounted bills`}
          icon={Percent}
          color="purple"
        />
        <StatCard
          title="PayHere Usage"
          value={`${payherePct}%`}
          sub={`${completedCount} completed via gateways`}
          icon={CreditCard}
          color="blue"
          trend={{ value: `${100 - payherePct}% WEBXPAY`, up: false }}
        />
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Invoices</h3>
          <div className="flex items-center gap-2">
            {(['all', 'paid', 'pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  filter === f ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {f === 'all' ? `All (${BILL_HEADERS.length})` : f === 'paid' ? `Paid (${completedCount})` : `Pending (${BILL_HEADERS.length - completedCount})`}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Invoice #</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Patient</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Items</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Subtotal</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Discount</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Delivery</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Grand Total</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Payment</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-blue-600">{b.invoiceNo}</span>
                    {b.rxId && <span className="block text-[10px] text-slate-400">Rx: {b.rxId}</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-slate-800">{b.patient}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-slate-500 truncate max-w-[200px] block">{b.items}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm text-slate-700 tabular-nums">{formatCurrency(b.totalPrice)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    {b.discountAmount > 0 ? (
                      <div>
                        <span className="text-sm text-red-600 font-medium tabular-nums">-{formatCurrency(b.discountAmount)}</span>
                        <span className="block text-[10px] text-slate-400">{b.discountType}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    {b.deliveryFee > 0 ? (
                      <span className="text-sm text-slate-600 tabular-nums inline-flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        {formatCurrency(b.deliveryFee)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">Pickup</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-bold text-slate-800 tabular-nums">{formatCurrency(b.grandTotal)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {b.paymentMethod ? (
                      <Badge label={b.paymentMethod} variant={PAYMENT_BADGE[b.paymentMethod] ?? 'gray'} />
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      b.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', b.isPaid ? 'bg-green-500' : 'bg-amber-500')} />
                      {b.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400">{b.billDate}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-opacity">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Showing {filtered.length} of {BILL_HEADERS.length} invoices</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Discounts: <span className="text-red-600 font-bold tabular-nums">{formatCurrency(totalDiscount)}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Collected: <span className="text-slate-800 font-bold tabular-nums">
                {formatCurrency(BILL_HEADERS.filter(b => b.isPaid).reduce((s, b) => s + b.grandTotal, 0))}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
