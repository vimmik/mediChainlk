'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { INVOICES } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Clock, CheckCircle, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const todayRevenue = INVOICES
    .filter((inv) => inv.date === '2026-04-04' && inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingTotal = INVOICES
    .filter((inv) => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const completedCount = INVOICES.filter((inv) => inv.status === 'Paid').length;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          sub={`${INVOICES.filter(i => i.status === 'Pending').length} invoices pending`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completed Transactions"
          value={completedCount}
          sub="Paid this week"
          icon={CheckCircle}
          color="blue"
          trend={{ value: '+3 vs last week', up: true }}
        />
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Invoices</h3>
          <span className="text-xs text-slate-400">{INVOICES.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Invoice #</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Patient</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Items</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-blue-600">{inv.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-slate-800">{inv.patient}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-500 truncate max-w-xs block">{inv.items}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-slate-800 tabular-nums">LKR {inv.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      inv.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700',
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        inv.status === 'Paid' ? 'bg-green-500' : 'bg-amber-500',
                      )} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400">{inv.date}</span>
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
          <span className="text-xs text-slate-400">Showing {INVOICES.length} of {INVOICES.length} invoices</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Total collected: <span className="text-slate-800 font-bold tabular-nums">
                LKR {INVOICES.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
