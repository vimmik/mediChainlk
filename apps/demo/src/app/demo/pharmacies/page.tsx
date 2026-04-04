'use client';

import { PHARMACIES } from '@/lib/mock-data';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Building2, MapPin, Hash, TrendingUp, ShoppingCart } from 'lucide-react';

export default function PharmaciesPage() {
  return (
    <div>
      <PageHeader
        title="Pharmacy Tenants"
        sub={`${PHARMACIES.length} registered · ${PHARMACIES.filter(p => p.isActive).length} active`}
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Building2 className="w-4 h-4" /> Add Pharmacy
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PHARMACIES.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3 h-3" /> {p.city}
                  </div>
                </div>
              </div>
              <StatusBadge status={p.isActive ? 'ok' : 'REJECTED'} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-slate-500">Orders</p>
                <p className="text-lg font-bold text-slate-900">{p.orders}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 text-center col-span-2">
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(p.revenue)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Hash className="w-3 h-3" /> {p.licenseNo}
            </div>

            {p.isActive && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button className="flex-1 text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">View Details</button>
                <button className="flex-1 text-xs font-medium text-slate-600 hover:text-slate-700 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Manage Users</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
