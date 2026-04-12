'use client';

import { StatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DELIVERY_QUOTES, ORDERS, PRESCRIPTIONS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { useDemoStore, useHasHydrated } from '@/store/demo-store';
import {
    Camera,
    CheckCircle,
    ChevronRight,
    Clock,
    CreditCard,
    MapPin,
    MessageSquare,
    Navigation,
    Package,
    Phone,
    Pill, Star,
    Truck,
    Upload
} from 'lucide-react';
import { useState } from 'react';

const ORDER_STEPS = ['PRESCRIPTION_CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DISPATCHED', 'DELIVERED'];

const STEP_LABELS: Record<string, string> = {
  PRESCRIPTION_CONFIRMED: 'Rx Confirmed',
  PREPARING: 'Preparing Order',
  READY_FOR_PICKUP: 'Ready for Pickup',
  DISPATCHED: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

const STEP_ICONS = [Clock, CheckCircle, Pill, Truck, Package];

// Customer's own orders (first 2)
const MY_ORDERS = ORDERS.slice(0, 2);

type Tab = 'upload' | 'track' | 'history';

export default function CustomerPage() {
  const { getOrderStatus, advanceOrderStatus } = useDemoStore();
  const hasHydrated = useHasHydrated();
  const [tab, setTab] = useState<Tab>('upload');
  const [uploadStep, setUploadStep] = useState<'idle' | 'preview' | 'processing' | 'done'>('idle');
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [trackOrderId, setTrackOrderId] = useState(MY_ORDERS[0].id);

  const handleUpload = () => {
    setUploadStep('preview');
  };

  const handleConfirmUpload = () => {
    setUploadStep('processing');
    setTimeout(() => setUploadStep('done'), 2200);
  };

  const trackOrder = MY_ORDERS.find(o => o.id === trackOrderId)!;
  const currentStatus = hasHydrated ? getOrderStatus(trackOrder.id) : (trackOrder.status ?? 'PRESCRIPTION_CONFIRMED');
  const currentStepIdx = ORDER_STEPS.indexOf(currentStatus);
  const statusOf = (id: string) => hasHydrated ? getOrderStatus(id) : (ORDERS.find(o => o.id === id)?.status ?? 'PENDING');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'upload', label: 'Upload Rx' },
    { id: 'track', label: 'Track Order' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Customer App" sub="Mobile app simulation — patient view" />

      {/* Mobile phone frame */}
      <div className="flex justify-center">
        <div className="w-full max-w-[375px] bg-white rounded-[2.5rem] border-4 sm:border-[6px] border-slate-800 shadow-2xl overflow-hidden">

          {/* Status bar */}
          <div className="bg-slate-900 text-white text-xs flex items-center justify-between px-6 py-2">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1,2,3,4].map(b => <div key={b} className={`w-1 rounded-sm ${b <= 3 ? 'bg-white' : 'bg-white/30'}`} style={{ height: `${b * 3}px`, marginTop: `${(4 - b) * 3}px` }} />)}
              </div>
              <span className="text-[10px] ml-1">●●●</span>
              <span className="text-[10px] ml-0.5">100%</span>
            </div>
          </div>

          {/* App header */}
          <div className="bg-blue-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs">Good morning,</p>
                <p className="text-white font-bold text-lg leading-tight">Kamal Perera</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">KP</span>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 bg-white">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-slate-50 min-h-[520px]">

            {/* Upload Rx tab */}
            {tab === 'upload' && (
              <div className="p-4 space-y-4">
                {uploadStep === 'idle' && (
                  <>
                    <div
                      onClick={handleUpload}
                      className="bg-white border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                        <Camera className="w-7 h-7 text-blue-600" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">Take Photo / Upload</p>
                      <p className="text-xs text-slate-400 mt-1">JPEG · PNG · PDF accepted</p>
                    </div>
                    <p className="text-center text-xs text-slate-400">or</p>
                    <button
                      onClick={handleUpload}
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-3 rounded-xl transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Choose from Gallery
                    </button>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">How it works</p>
                      <div className="space-y-1">
                        {['Photo uploads securely to cloud', 'AI extracts medicines automatically', 'Pharmacist verifies & approves', 'Order dispatched to your door'].map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-blue-600">
                            <span className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {uploadStep === 'preview' && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Prescription Preview</p>
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-4 font-mono text-xs text-slate-600 space-y-1">
                        <p className="font-bold">Dr. Sunil Perera, MBBS</p>
                        <p className="text-slate-400 text-[10px]">Reg: LK-DOC-8821</p>
                        <p className="font-bold mt-2">Rx</p>
                        {PRESCRIPTIONS[0].medicines.map((m, i) => (
                          <p key={i}>{i + 1}. {m.drug} {m.dosage}</p>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">Select Delivery Method</p>
                      {DELIVERY_QUOTES.map(q => (
                        <button
                          key={q.provider}
                          onClick={() => setSelectedQuote(q.provider)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            selectedQuote === q.provider
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{q.label}</p>
                              <p className="text-[10px] text-slate-400">{q.eta} min · {q.available ? 'Available' : 'Unavailable'}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{formatCurrency(q.fee)}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleConfirmUpload}
                      disabled={!selectedQuote}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
                    >
                      Submit Prescription
                    </button>
                  </div>
                )}

                {uploadStep === 'processing' && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Pill className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">Analysing prescription…</p>
                    <p className="text-xs text-slate-400">AI is extracting medicines</p>
                  </div>
                )}

                {uploadStep === 'done' && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="font-bold text-green-800">Prescription Submitted!</p>
                      <p className="text-xs text-green-600 mt-1">Pharmacist will review within 15 min</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Summary</p>
                      {PRESCRIPTIONS[0].medicines.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                          <Pill className="w-3 h-3 text-slate-400" />
                          <span>{m.drug} {m.dosage}</span>
                          <span className="ml-auto text-slate-400">{m.duration}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { setUploadStep('idle'); setSelectedQuote(null); setTab('track'); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
                    >
                      Track Order
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Track Order tab */}
            {tab === 'track' && (
              <div className="p-4 space-y-4">
                {/* Order selector */}
                <div className="flex gap-2">
                  {MY_ORDERS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setTrackOrderId(o.id)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        trackOrderId === o.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      #{o.id.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Status card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{trackOrder.patient}</p>
                      <p className="text-xs text-slate-400">{trackOrder.time}</p>
                    </div>
                    <StatusBadge status={currentStatus} />
                  </div>

                  {/* Progress stepper */}
                  <div className="space-y-0">
                    {ORDER_STEPS.map((s, i) => {
                      const StepIcon = STEP_ICONS[i];
                      const isCompleted = i < currentStepIdx;
                      const isActive = i === currentStepIdx;
                      return (
                        <div key={s} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                              isCompleted ? 'bg-green-500 text-white' :
                              isActive    ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                              'bg-slate-200 text-slate-400'
                            }`}>
                              {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                            </div>
                            {i < ORDER_STEPS.length - 1 && (
                              <div className={`w-0.5 h-6 my-0.5 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />
                            )}
                          </div>
                          <div className="pb-1 pt-0.5">
                            <p className={`text-xs font-semibold ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-slate-400'}`}>
                              {STEP_LABELS[s]}
                            </p>
                            {isActive && (
                              <p className="text-[10px] text-slate-400 animate-pulse">In progress…</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery info */}
                {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Delivering to: No. 42, Galle Road, Colombo 03</span>
                    </div>
                    {trackOrder.delivery && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Via {trackOrder.delivery} · ETA 20–35 min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Live tracking active</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call Pharmacy
                  </button>
                  <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                </div>

                {/* Demo: advance button */}
                {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                  <button
                    onClick={() => advanceOrderStatus(trackOrder.id)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-xl border border-blue-200 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" /> Simulate Next Step
                  </button>
                )}
              </div>
            )}

            {/* History tab */}
            {tab === 'history' && (
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Past Orders</p>
                {ORDERS.map(o => {
                  const status = statusOf(o.id);
                  return (
                    <div key={o.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                          #{o.id.toUpperCase()}
                        </span>
                        <StatusBadge status={status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3 h-3" /> {o.time}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(o.total)}</span>
                      </div>
                      {status === 'DELIVERED' && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                          </div>
                          <button className="text-[10px] text-blue-600 font-medium">
                            Reorder <ChevronRight className="w-2.5 h-2.5 inline" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <CreditCard className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-600">Payment via PayHere</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Visa •••• 4242 saved</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom nav */}
          <div className="bg-white border-t border-slate-200 px-4 py-3 flex justify-around">
            {[
              { icon: Upload, label: 'Upload', tabId: 'upload' as Tab },
              { icon: Navigation, label: 'Track', tabId: 'track' as Tab },
              { icon: Clock, label: 'History', tabId: 'history' as Tab },
            ].map(({ icon: Icon, label, tabId }) => (
              <button
                key={tabId}
                onClick={() => setTab(tabId)}
                className={`flex flex-col items-center gap-0.5 ${tab === tabId ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Home indicator */}
          <div className="bg-white pb-2 flex justify-center">
            <div className="w-24 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
