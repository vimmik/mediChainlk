'use client';

import { useState } from 'react';
import { PRESCRIPTIONS } from '@/lib/mock-data';
import { useDemoStore } from '@/store/demo-store';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfidenceBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { FileText, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';

export default function PrescriptionsPage() {
  const { reviewedRx, reviewPrescription, getPrescriptionStatus } = useDemoStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const rx = PRESCRIPTIONS.find(r => r.id === selected);
  const pending = PRESCRIPTIONS.filter(r => getPrescriptionStatus(r.id) === 'PENDING_REVIEW');
  const done    = PRESCRIPTIONS.filter(r => getPrescriptionStatus(r.id) !== 'PENDING_REVIEW');

  return (
    <div className="flex gap-6 h-full">
      {/* Left: queue */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <PageHeader title="Review Queue" sub={`${pending.length} pending`} />

        {pending.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">All prescriptions reviewed!</p>
          </div>
        )}

        {pending.map((r) => (
          <button
            key={r.id}
            onClick={() => { setSelected(r.id); setNotes(''); }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${selected === r.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-slate-900 text-sm">{r.patient}</p>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-2">{r.medicines.length} medicines · {formatDate(r.uploadedAt)}</p>
            <ConfidenceBadge tier={r.confidenceTier} pct={r.confidence} />
          </button>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Reviewed Today</p>
            {done.map((r) => {
              const status = getPrescriptionStatus(r.id);
              return (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{r.patient}</p>
                    <StatusBadge status={status} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Right: review panel */}
      <div className="flex-1">
        {!rx ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Select a prescription to review</p>
              <p className="text-sm text-slate-400 mt-1">Click any item from the queue</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-slide-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{rx.patient}</h2>
                <p className="text-sm text-slate-500">{rx.phone} · Uploaded {formatDate(rx.uploadedAt)}</p>
              </div>
              <ConfidenceBadge tier={rx.confidenceTier} pct={rx.confidence} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Prescription image mock */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Prescription Image</p>
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-56 flex items-center justify-center">
                  <div className="text-center">
                    <div className="space-y-1.5 font-mono text-xs text-slate-500 text-left p-4 bg-white/70 rounded-lg">
                      <p>Dr. Sunil Perera, MBBS</p>
                      <p className="border-b border-dashed border-slate-300 pb-1">Reg: LK-DOC-8821</p>
                      <p className="mt-1 font-bold">Rx</p>
                      {rx.medicines.map((m, i) => (
                        <p key={i}>{i + 1}. {m.drug} {m.dosage} — {m.frequency} × {m.duration}</p>
                      ))}
                      <p className="border-t border-dashed border-slate-300 pt-1 mt-2">Sig: As directed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted medicines */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">AI-Extracted Medicines</p>
                <div className="space-y-2">
                  {rx.medicines.map((m, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${m.matched ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-slate-900">{m.drug} {m.dosage}</span>
                        <span className={`text-xs font-medium ${m.matched ? 'text-green-600' : 'text-amber-600'}`}>
                          {m.matched ? '✓ Matched' : '⚠ Unmatched'}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>Freq: {m.frequency}</span>
                        <span>Duration: {m.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <textarea
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows={2}
                    placeholder="Pharmacist notes (optional)..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => { reviewPrescription(rx.id, true, notes); setSelected(null); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => { reviewPrescription(rx.id, false, notes); setSelected(null); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm py-2.5 rounded-lg border border-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
