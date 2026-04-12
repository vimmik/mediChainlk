'use client';

import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
    GRN_DETAILS,
    GRN_HEADERS,
    ITEM_REQUESTS,
    MEDICINES
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useDemoStore, useHasHydrated } from '@/store/demo-store';
import {
    AlertTriangle,
    Check,
    ChevronDown, ChevronUp,
    ClipboardCheck,
    Clock,
    Package,
    Truck,
} from 'lucide-react';
import { useState } from 'react';

export default function SupplyChainPage() {
  const { approveGrn, isGrnApproved, approveRequest, isRequestApproved } = useDemoStore();
  const hasHydrated = useHasHydrated();
  const [tab, setTab] = useState<'requests' | 'grn'>('requests');
  const [expandedGrn, setExpandedGrn] = useState<string | null>(null);

  const pendingRequests = ITEM_REQUESTS.filter((r) => !r.isApproved && !(hasHydrated && isRequestApproved(r.id)));
  const pendingGrns = GRN_HEADERS.filter((g) => !g.isApproved && !(hasHydrated && isGrnApproved(g.id)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supply Chain"
        sub="Item requests, goods received notes, and procurement management"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={ITEM_REQUESTS.length} icon={ClipboardCheck} color="blue" sub="All item requests" />
        <StatCard title="Pending Approval" value={pendingRequests.length} icon={Clock} color="amber" sub="Requests awaiting review" />
        <StatCard title="GRN Records" value={GRN_HEADERS.length} icon={Package} color="green" sub="Goods received notes" />
        <StatCard title="Pending GRN" value={pendingGrns.length} icon={AlertTriangle} color="red" sub="GRNs awaiting approval" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        {(['requests', 'grn'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t === 'requests' ? 'Item Requests' : 'GRN Records'}
          </button>
        ))}
      </div>

      {/* Item Requests Tab */}
      {tab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Request ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ITEM_REQUESTS.map((req) => {
                const approved = req.isApproved || (hasHydrated && isRequestApproved(req.id));
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{req.id.toUpperCase()}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{req.medicineName}</td>
                    <td className="px-5 py-3">
                      <Badge
                        label={req.urgency}
                        variant={req.urgency === 'Critical' ? 'red' : req.urgency === 'High' ? 'orange' : req.urgency === 'Medium' ? 'yellow' : 'gray'}
                      />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">{req.quantity}</td>
                    <td className="px-5 py-3 text-slate-500">{req.requestDate}</td>
                    <td className="px-5 py-3">
                      {req.isSupplied ? (
                        <Badge label="Supplied" variant="green" />
                      ) : approved ? (
                        <Badge label="Approved" variant="blue" />
                      ) : (
                        <Badge label="Pending" variant="yellow" />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {!approved && !req.isSupplied ? (
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* GRN Records Tab */}
      {tab === 'grn' && (
        <div className="space-y-3">
          {GRN_HEADERS.map((grn) => {
            const approved = grn.isApproved || (hasHydrated && isGrnApproved(grn.id));
            const details = GRN_DETAILS.filter((d) => d.grnHeaderId === grn.id);
            const expanded = expandedGrn === grn.id;

            return (
              <div key={grn.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header Row */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedGrn(expanded ? null : grn.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      approved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600',
                    )}>
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{grn.grnNo}</p>
                      <p className="text-xs text-slate-500">{grn.supplierName} • {grn.grnDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-sm font-medium text-slate-700">{grn.totalItems} item{grn.totalItems > 1 ? 's' : ''}</p>
                      <p className="text-xs text-slate-500">{grn.totalQty} units total</p>
                    </div>
                    <Badge label={approved ? 'Approved' : 'Pending'} variant={approved ? 'green' : 'yellow'} />
                    {!approved && (
                      <button
                        onClick={(e) => { e.stopPropagation(); approveGrn(grn.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Detail Rows */}
                {expanded && details.length > 0 && (
                  <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[760px]">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="text-left px-5 py-2 text-xs font-semibold text-slate-500">Medicine</th>
                          <th className="text-left px-5 py-2 text-xs font-semibold text-slate-500">Batch No</th>
                          <th className="text-right px-5 py-2 text-xs font-semibold text-slate-500">Qty Received</th>
                          <th className="text-right px-5 py-2 text-xs font-semibold text-slate-500">Available</th>
                          <th className="text-left px-5 py-2 text-xs font-semibold text-slate-500">Unit</th>
                          <th className="text-left px-5 py-2 text-xs font-semibold text-slate-500">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {details.map((d) => {
                          const med = MEDICINES.find((m) => m.id === d.medicineId);
                          return (
                            <tr key={d.id} className="hover:bg-slate-50/50">
                              <td className="px-5 py-2.5 font-medium text-slate-700">{med?.name ?? d.medicineId}</td>
                              <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{d.batchNo}</td>
                              <td className="px-5 py-2.5 text-right font-semibold text-slate-700">{d.quantity}</td>
                              <td className="px-5 py-2.5 text-right text-slate-600">{d.availableQty}</td>
                              <td className="px-5 py-2.5 text-slate-500">{d.unit}</td>
                              <td className="px-5 py-2.5 text-slate-500">{d.expiryDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
