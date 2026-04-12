'use client';

import { Badge, StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { INVENTORY } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { useDemoStore, useHasHydrated } from '@/store/demo-store';
import { AlertTriangle, Building2, MapPin, Minus, Package, Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export default function InventoryPage() {
  const { adjustStock, getStock } = useDemoStore();
  const hasHydrated = useHasHydrated();
  const [search, setSearch] = useState('');

  const stockOf = (id: string) => hasHydrated ? getStock(id) : (INVENTORY.find(i => i.id === id)?.stock ?? 0);
  const lowItems = INVENTORY.filter(i => stockOf(i.id) < i.reorder);
  const highAlertItems = INVENTORY.filter(i => i.isHighAlert);
  const totalValue = INVENTORY.reduce((s, i) => s + stockOf(i.id) * i.price, 0);

  const filtered = INVENTORY.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.binCode ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        sub="Stock levels, bin locations & reorder management"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Package className="w-4 h-4" /> Add Stock
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Items" value={INVENTORY.length} sub="Unique medicines" icon={Package} color="blue" />
        <StatCard title="Low Stock Items" value={lowItems.length} sub="Below reorder level" icon={AlertTriangle} color="amber" trend={lowItems.length > 3 ? { value: 'Action needed', up: false } : undefined} />
        <StatCard title="High-Alert Drugs" value={highAlertItems.length} sub="Require pharmacist review" icon={ShieldAlert} color="red" />
        <StatCard title="Total Stock Value" value={formatCurrency(totalValue)} sub="At current prices" icon={Building2} color="green" />
      </div>

      {highAlertItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            High-alert medicines in stock: {highAlertItems.map(i => i.name).join(', ')}. Always route to pharmacist review.
          </p>
        </div>
      )}

      {lowItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {lowItems.length} item{lowItems.length > 1 ? 's' : ''} below reorder level: {lowItems.map(i => i.name).join(', ')}
          </p>
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by medicine, company, or bin code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Company</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Bin Location</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Min / Reorder / Max</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Expiry</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const stock = stockOf(item.id);
              const status = stock <= 0 ? 'critical' : stock < item.reorder ? (stock < item.reorder * 0.5 ? 'critical' : 'low') : 'ok';
              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${status === 'critical' ? 'bg-red-50/40' : status === 'low' ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        {item.isHighAlert && <Badge label="HIGH ALERT" variant="red" />}
                      </div>
                      <p className="text-xs text-slate-400">{item.unit} · {item.categoryName ?? ''}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-slate-600">{item.companyName ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {item.binCode ? (
                      <span className="text-xs inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-medium">{item.binCode}</span>
                        <span className="text-slate-400">· {item.section}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-slate-900'}`}>
                        {stock}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-amber-400' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (stock / (item.reorder * 3)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400">{item.minLevel ?? '—'}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-amber-600 font-medium">{item.reorder}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-400">{item.maxLevel ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-600 text-xs">{item.expiry}</td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium text-xs">{formatCurrency(item.price)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustStock(item.id, -10)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => adjustStock(item.id, 50)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-600 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
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
