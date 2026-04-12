'use client';

import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
    BINS,
    ITEM_DETAILS,
    MEASURING_UNITS,
    MEDICINES,
    MEDICINE_BIN_MAP,
    MEDICINE_CATEGORIES, MEDICINE_COMPANIES,
} from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, Building2, Filter, Pill, Search } from 'lucide-react';
import { useState } from 'react';

export default function MedicinesPage() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const enriched = MEDICINES.map((med) => {
    const category = MEDICINE_CATEGORIES.find((c) => c.id === med.categoryId);
    const company = MEDICINE_COMPANIES.find((c) => c.id === med.companyId);
    const unit = MEASURING_UNITS.find((u) => u.id === med.unitId);
    const binMap = MEDICINE_BIN_MAP.find((m) => m.medicineId === med.id);
    const bin = binMap ? BINS.find((b) => b.id === binMap.binId) : null;
    const item = ITEM_DETAILS.find((i) => i.medicineId === med.id);
    return { ...med, category, company, unit, bin, item };
  });

  const filtered = enriched.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      (m.company?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || m.categoryId === catFilter;
    return matchSearch && matchCat;
  });

  const highAlertCount = MEDICINES.filter((m) => m.isHighAlert).length;
  const totalStock = ITEM_DETAILS.reduce((s, i) => s + i.stock, 0);
  const criticalItems = ITEM_DETAILS.filter((i) => i.status === 'critical').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Catalog"
        sub="Complete medicine registry with categories, companies, and storage locations"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Pill className="w-4 h-4" /> Register Medicine
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Medicines" value={MEDICINES.length} icon={Pill} color="blue" sub="Registered in formulary" />
        <StatCard title="Categories" value={MEDICINE_CATEGORIES.length} icon={Filter} color="purple" sub="Active categories" />
        <StatCard title="High-Alert Drugs" value={highAlertCount} icon={AlertTriangle} color="red" sub="Require pharmacist review" />
        <StatCard title="Suppliers" value={MEDICINE_COMPANIES.length} icon={Building2} color="green" sub="Active companies" />
      </div>

      {/* High Alert Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">High-Alert Medicines</p>
          <p className="text-xs text-red-600 mt-0.5">
            {MEDICINES.filter((m) => m.isHighAlert).map((m) => m.name).join(', ')} — Always route to pharmacist review regardless of AI confidence.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {MEDICINE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bin</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.code}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      {m.name}
                      {m.isHighAlert && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> HIGH ALERT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={m.category?.name ?? '-'} variant="blue" />
                  </td>
                  <td className="px-5 py-3 text-slate-600">{m.company?.name ?? '-'}</td>
                  <td className="px-5 py-3 text-slate-500">{m.unit?.name ?? '-'}</td>
                  <td className="px-5 py-3">
                    {m.bin ? (
                      <span className="text-xs">
                        <span className="font-mono font-medium text-slate-700">{m.bin.code}</span>
                        <span className="text-slate-400 ml-1">({m.bin.section})</span>
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700">
                    {m.item ? m.item.stock.toLocaleString() : '-'}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">
                    {m.item ? formatCurrency(m.item.unitPrice) : '-'}
                  </td>
                  <td className="px-5 py-3">
                    {m.item ? (
                      <Badge
                        label={m.item.status === 'ok' ? 'In Stock' : m.item.status === 'low' ? 'Low Stock' : 'Critical'}
                        variant={m.item.status === 'ok' ? 'green' : m.item.status === 'low' ? 'yellow' : 'red'}
                      />
                    ) : (
                      <Badge label="No Stock" variant="gray" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          Showing {filtered.length} of {MEDICINES.length} medicines • Total stock: {totalStock.toLocaleString()} units across all items • {criticalItems} critical item{criticalItems !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
