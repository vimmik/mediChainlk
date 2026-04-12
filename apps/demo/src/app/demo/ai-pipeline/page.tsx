'use client';

import { ConfidenceBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { PRESCRIPTIONS } from '@/lib/mock-data';
import { useDemoStore } from '@/store/demo-store';
import {
    BarChart2,
    Brain,
    CheckCircle,
    ChevronRight,
    Cpu, Eye,
    FileImage,
    FlaskConical,
    Loader2,
    Pill,
    Play, RotateCcw,
    Upload,
    Wand2
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const STEPS = [
  {
    id: 'upload',
    label: 'S3 Upload',
    icon: Upload,
    color: 'blue',
    desc: 'Prescription image uploaded to S3 bucket with server-side KMS encryption.',
    duration: 600,
  },
  {
    id: 'preprocess',
    label: 'Preprocessing',
    icon: Cpu,
    color: 'purple',
    desc: 'OpenCV deskew, denoise, contrast normalisation, binarisation.',
    duration: 900,
  },
  {
    id: 'ocr',
    label: 'OCR Extraction',
    icon: Eye,
    color: 'indigo',
    desc: 'Google Cloud Vision API extracts raw text with bounding-box confidence scores.',
    duration: 1200,
  },
  {
    id: 'nlp',
    label: 'NLP / Med7',
    icon: Brain,
    color: 'violet',
    desc: 'Med7 spaCy model identifies drug names, dosages, frequencies, and durations.',
    duration: 1100,
  },
  {
    id: 'match',
    label: 'Formulary Match',
    icon: FlaskConical,
    color: 'teal',
    desc: 'rapidfuzz fuzzy-matching against the pharmacy formulary database (≥ 85% threshold).',
    duration: 700,
  },
  {
    id: 'confidence',
    label: 'Confidence Score',
    icon: BarChart2,
    color: 'green',
    desc: 'Per-field confidence aggregated. HIGH ≥ 0.90 · MEDIUM 0.70–0.90 · LOW < 0.70.',
    duration: 500,
  },
  {
    id: 'result',
    label: 'Result',
    icon: CheckCircle,
    color: 'emerald',
    desc: 'Prescription dispatched: auto-approved, queued for pharmacist review, or rejected.',
    duration: 400,
  },
];

const COLOR_MAP: Record<string, { bg: string; ring: string; text: string; iconBg: string; bar: string }> = {
  blue:    { bg: 'bg-blue-50',    ring: 'ring-blue-400',    text: 'text-blue-700',    iconBg: 'bg-blue-100',    bar: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-50',  ring: 'ring-purple-400',  text: 'text-purple-700',  iconBg: 'bg-purple-100',  bar: 'bg-purple-500' },
  indigo:  { bg: 'bg-indigo-50',  ring: 'ring-indigo-400',  text: 'text-indigo-700',  iconBg: 'bg-indigo-100',  bar: 'bg-indigo-500' },
  violet:  { bg: 'bg-violet-50',  ring: 'ring-violet-400',  text: 'text-violet-700',  iconBg: 'bg-violet-100',  bar: 'bg-violet-500' },
  teal:    { bg: 'bg-teal-50',    ring: 'ring-teal-400',    text: 'text-teal-700',    iconBg: 'bg-teal-100',    bar: 'bg-teal-500' },
  green:   { bg: 'bg-green-50',   ring: 'ring-green-400',   text: 'text-green-700',   iconBg: 'bg-green-100',   bar: 'bg-green-500' },
  emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-400', text: 'text-emerald-700', iconBg: 'bg-emerald-100', bar: 'bg-emerald-500' },
  slate:   { bg: 'bg-slate-50',   ring: 'ring-slate-300',   text: 'text-slate-500',   iconBg: 'bg-slate-100',   bar: 'bg-slate-300' },
};

const SAMPLE = PRESCRIPTIONS[1]; // medium confidence

export default function AiPipelinePage() {
  const { pipelineStep, pipelineRunning, setPipelineStep, setPipelineRunning } = useDemoStore();
  const [activeIdx, setActiveIdx] = useState(pipelineStep);
  const [running, setRunning] = useState(false);

  const reset = useCallback(() => {
    setRunning(false);
    setActiveIdx(-1);
    setPipelineStep(-1);
    setPipelineRunning(false);
  }, [setPipelineStep, setPipelineRunning]);

  const run = useCallback(() => {
    if (running) return;
    reset();
    setRunning(true);
    setPipelineRunning(true);

    let idx = 0;

    const advance = () => {
      if (idx >= STEPS.length) {
        setRunning(false);
        setPipelineRunning(false);
        return;
      }
      setActiveIdx(idx);
      setPipelineStep(idx);
      const delay = STEPS[idx].duration;
      idx++;
      setTimeout(advance, delay);
    };
    setTimeout(advance, 200);
  }, [running, reset, setPipelineRunning, setPipelineStep]);

  // sync from store on mount
  useEffect(() => {
    setActiveIdx(pipelineStep);
    setRunning(pipelineRunning);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = !running && activeIdx >= STEPS.length - 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Pipeline Demo"
        sub="Prescription OCR · NLP · Formulary matching"
        action={
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={run}
              disabled={running}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? 'Processing…' : activeIdx >= 0 ? 'Run Again' : 'Run Pipeline'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pipeline steps */}
        <div className="xl:col-span-2 space-y-3">
          {STEPS.map((step, i) => {
            const state: 'done' | 'active' | 'pending' =
              i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending';
            const c = state === 'pending' ? COLOR_MAP.slate : COLOR_MAP[step.color];
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${
                  state === 'active' ? `${c.bg} ring-2 ${c.ring} shadow-sm` :
                  state === 'done'   ? `${c.bg} border-transparent` :
                  'bg-white border-slate-200 opacity-50'
                }`}
              >
                {/* Step number / icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                  {state === 'active' && running ? (
                    <Loader2 className={`w-5 h-5 animate-spin ${c.text}`} />
                  ) : state === 'done' ? (
                    <CheckCircle className={`w-5 h-5 ${c.text}`} />
                  ) : (
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>
                      Step {i + 1}
                    </span>
                    {state === 'active' && (
                      <span className={`text-xs font-medium ${c.text} animate-pulse`}>● live</span>
                    )}
                    {state === 'done' && (
                      <span className="text-xs text-slate-400">{step.duration}ms</span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{step.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>

                  {/* Progress bar when active */}
                  {state === 'active' && (
                    <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.bar} rounded-full animate-progress-fill`}
                        style={{ animationDuration: `${step.duration}ms` }}
                      />
                    </div>
                  )}
                </div>

                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <div className="absolute -bottom-3 left-9 z-10">
                    <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right panel: input + output */}
        <div className="space-y-4">
          {/* Input card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileImage className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input Prescription</p>
            </div>
            <div className={`rounded-lg p-3 font-mono text-xs space-y-1 leading-relaxed transition-all duration-500 ${
              activeIdx >= 0 ? 'bg-slate-900 text-green-300' : 'bg-slate-100 text-slate-400'
            }`}>
              {activeIdx >= 0 ? (
                <>
                  <p className="text-slate-400">{'// raw OCR output'}</p>
                  <p>Dr. Sunil Perera MBBS</p>
                  <p>Reg: LK-DOC-8821</p>
                  <p className="text-yellow-300 mt-1">Rx:</p>
                  {SAMPLE.medicines.map((m, i) => (
                    <p key={i} className={activeIdx >= 3 ? 'text-green-300' : 'text-slate-300'}>
                      {i + 1}. {m.drug} {m.dosage}
                    </p>
                  ))}
                  <p className="text-slate-400 mt-1">Sig: As directed</p>
                </>
              ) : (
                <p className="text-center py-4">Awaiting input…</p>
              )}
            </div>
          </div>

          {/* Extracted medicines — visible after NLP step */}
          {activeIdx >= 3 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-violet-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extracted Medicines</p>
              </div>
              <div className="space-y-2">
                {SAMPLE.medicines.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-lg border text-xs ${
                      activeIdx >= 4
                        ? m.matched
                          ? 'bg-green-50 border-green-200'
                          : 'bg-amber-50 border-amber-200'
                        : 'bg-violet-50 border-violet-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-800">{m.drug}</span>
                        <span className="text-slate-500">{m.dosage}</span>
                      </div>
                      {activeIdx >= 4 && (
                        <span className={`font-medium text-xs ${m.matched ? 'text-green-600' : 'text-amber-600'}`}>
                          {m.matched ? '✓ matched' : '⚠ fuzzy'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-0.5">{m.frequency} · {m.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence result — visible after confidence step */}
          {activeIdx >= 5 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-slide-in">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-green-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence Result</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <ConfidenceBadge tier={SAMPLE.confidenceTier} pct={SAMPLE.confidence} />
                <span className="text-2xl font-bold text-slate-900">{(SAMPLE.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${SAMPLE.confidence * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                MEDIUM confidence — routed to pharmacist review queue
              </p>
            </div>
          )}

          {/* Final outcome */}
          {done && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-slide-in">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="font-semibold text-emerald-800 text-sm">Pipeline Complete</p>
              </div>
              <p className="text-xs text-emerald-600">
                Prescription queued for pharmacist review. Patient notified via push notification.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
