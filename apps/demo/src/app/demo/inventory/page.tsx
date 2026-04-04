'use client';

import { INVENTORY } from '@/lib/mock-data';
import { useDemoStore } from '@/store/demo-store';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  const { adjustStock, getStock } = useDemoStore();
  const lowItems = INVENTORY.filter(i => getStock(i.id) < i.reorder);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        sub="Stock levels and reorder management"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Package className="w-4 h-4" /> Add Stock
          </button>
        }
      />

      {lowItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {lowItems.length} item{lowItems.length > 1 ? 's' : ''} below reorder level: {lowItems.map(i => i.name).join(', ')}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder At</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {INVENTORY.map((item) => {
              const stock = getStock(item.id);
              const status = stock <= 0 ? 'critical' : stock < item.reorder ? (stock < item.reorder * 0.5 ? 'critical' : 'low') : 'ok';
              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${status === 'critical' ? 'bg-red-50/40' : status === 'low' ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.unit}</p>
                    </div>
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
                  <td className="px-5 py-3.5 text-slate-600">{item.reorder}</td>
                  <td className="px-5 py-3.5 text-slate-600">{item.expiry}</td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">LKR {item.price.toFixed(2)}</td>
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
