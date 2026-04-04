'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  { icon: '🔬', label: 'OCR Prescription Reading' },
  { icon: '🏢', label: 'Multi-Tenant Architecture' },
  { icon: '🚚', label: 'Real-time Delivery Tracking' },
];

export default function LandingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2000;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        router.push('/demo/dashboard');
      }
    }, 16);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl animate-fade-up">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 60%, #8b5cf6 100%)' }}>
          M
        </div>

        {/* Title */}
        <h1
          className="text-5xl font-black tracking-tight text-white mb-3"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          MediChainLK
        </h1>

        {/* Tagline */}
        <p className="text-xl text-blue-200 font-medium mb-8">
          AI-Powered Pharmacy Management Platform
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {FEATURES.map(({ icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium"
            >
              <span>{icon}</span>
              {label}
            </span>
          ))}
        </div>

        {/* Enter demo button */}
        <button
          onClick={() => router.push('/demo/dashboard')}
          className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-blue-500/30 hover:shadow-xl mb-10"
        >
          Enter Demo
          <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
        </button>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-blue-300">Loading demo environment…</span>
            <span className="text-xs text-blue-400 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Badge */}
        <div className="mt-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Demo Environment · v2.0 · April 2026</span>
        </div>
      </div>
    </div>
  );
}
