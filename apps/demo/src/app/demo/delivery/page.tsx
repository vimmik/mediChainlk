'use client';

import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DELIVERY_QUOTES, DELIVERY_RECORDS, ORDERS, USERS } from '@/lib/mock-data';
import { cn, formatCurrency } from '@/lib/utils';
import { CheckCircle, Clock, Navigation, Package, Truck } from 'lucide-react';

export default function DeliveryPage() {
  const activeDeliveries = DELIVERY_RECORDS.filter((d) => !d.isDelivered);
  const completedDeliveries = DELIVERY_RECORDS.filter((d) => d.isDelivered);
  const totalCost = DELIVERY_RECORDS.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Tracking"
        sub="Real-time delivery monitoring with driver details and ETA tracking"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Deliveries" value={activeDeliveries.length} icon={Truck} color="blue" sub="Currently in transit" />
        <StatCard title="Completed Today" value={completedDeliveries.length} icon={CheckCircle} color="green" sub="Successfully delivered" />
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} icon={Package} color="amber" sub="Today's delivery fees" />
        <StatCard title="Avg. ETA" value="45 min" icon={Clock} color="purple" sub="Average delivery time" />
      </div>

      {/* Active Deliveries */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          Active Deliveries
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeDeliveries.map((del) => {
            const order = ORDERS.find((o) => o.id === del.orderId);
            const patient = order ? USERS.find((u) => u.id === order.patientId) : null;
            return (
              <div key={del.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-800">{del.invoiceCode}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{del.provider} • Order: {del.orderId.toUpperCase()}</p>
                  </div>
                  <Badge label={del.isDelivered ? 'Delivered' : 'In Transit'} variant={del.isDelivered ? 'green' : 'blue'} />
                </div>

                {/* Driver Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Driver</p>
                    <p className="text-sm font-medium text-slate-800">{del.driverName}</p>
                    <p className="text-xs text-slate-500">{del.driverNic}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Vehicle</p>
                    <p className="text-sm font-medium text-slate-800">{del.vehicleType}</p>
                    <p className="text-xs text-slate-500 font-mono">{del.vehicleNumber}</p>
                  </div>
                </div>

                {/* Location & ETA */}
                <div className="flex items-center gap-2 mb-3 bg-blue-50 rounded-lg px-3 py-2">
                  <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700">{del.currentLocation}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600">ETA: {del.eta}</span>
                </div>

                {/* Customer & Cost */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Customer: {patient?.name ?? order?.patient ?? '-'}</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(del.cost)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Deliveries */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Completed Deliveries</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedDeliveries.map((del) => (
                <tr key={del.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{del.invoiceCode}</td>
                  <td className="px-5 py-3 text-slate-700">{del.provider}</td>
                  <td className="px-5 py-3">
                    <p className="text-slate-800">{del.driverName}</p>
                    <p className="text-[10px] text-slate-400">{del.driverNic}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-700">{del.vehicleType}</p>
                    <p className="text-[10px] font-mono text-slate-400">{del.vehicleNumber}</p>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700">{formatCurrency(del.cost)}</td>
                  <td className="px-5 py-3"><Badge label="Delivered" variant="green" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Partners */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Delivery Partners & Rates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DELIVERY_QUOTES.map((q) => (
            <div key={q.provider} className={cn(
              'rounded-xl border p-5 transition-all',
              q.available
                ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                : 'bg-slate-50 border-slate-100 opacity-60',
            )}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-800">{q.label}</p>
                <Badge label={q.available ? 'Available' : 'Unavailable'} variant={q.available ? 'green' : 'gray'} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(q.fee)}</p>
                  <p className="text-xs text-slate-500">per delivery</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-700">{q.eta} min</p>
                  <p className="text-xs text-slate-500">avg. ETA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
