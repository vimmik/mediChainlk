'use client';

import { VimmikLogo } from '@/components/shared/VimmikLogo';
import { CheckCircle2, DatabaseZap, Lock, ShieldCheck } from 'lucide-react';

export type LoginStage = 'recaptcha' | 'auth' | 'session';

interface LoginLoaderProps {
  stage: LoginStage | null;
}

const STAGES: { key: LoginStage; label: string; sub: string }[] = [
  { key: 'recaptcha', label: 'Security check',     sub: 'Verifying you\'re not a bot'     },
  { key: 'auth',      label: 'Authenticating',     sub: 'Validating your credentials'     },
  { key: 'session',   label: 'Creating session',   sub: 'Establishing secure session'     },
];

const STAGE_INDEX: Record<LoginStage, number> = { recaptcha: 0, auth: 1, session: 2 };

/** Progress arc percentage per stage */
const STAGE_PROGRESS: Record<LoginStage, number> = { recaptcha: 30, auth: 65, session: 92 };

const STAGE_TITLE: Record<LoginStage, string> = {
  recaptcha: 'Running security check',
  auth:      'Verifying credentials',
  session:   'Establishing session',
};

const STAGE_ICON: Record<LoginStage, React.ReactNode> = {
  recaptcha: <ShieldCheck className="w-8 h-8 text-blue-400" />,
  auth:      <Lock        className="w-8 h-8 text-blue-400 login-loader-icon-spin" />,
  session:   <DatabaseZap className="w-8 h-8 text-blue-400" />,
};

const R = 48;
const CIRC = 2 * Math.PI * R;

export function LoginLoader({ stage }: LoginLoaderProps) {
  if (!stage) return null;

  const activeIdx = STAGE_INDEX[stage];
  const progress  = STAGE_PROGRESS[stage];
  const dash      = (CIRC * progress) / 100;

  return (
    <div className="login-loader-overlay" role="status" aria-live="polite" aria-label="Signing in">
      <div className="login-loader-card">
        {/* animated scan line at top of card */}
        <div className="login-loader-scan-line" aria-hidden="true" />

        {/* ── arc progress + center icon ── */}
        <div className="login-loader-arc-wrap">
          <svg className="login-loader-arc" viewBox="0 0 110 110" aria-hidden="true">
            {/* track */}
            <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            {/* filled arc */}
            <circle
              cx="55" cy="55" r={R}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              transform="rotate(-90 55 55)"
              style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#4f8ef8" />
                <stop offset="100%" stopColor="#00d4c8" />
              </linearGradient>
            </defs>
          </svg>
          {/* icon */}
          <div className="login-loader-center-icon">
            <div className="login-loader-icon-ring" aria-hidden="true" />
            {STAGE_ICON[stage]}
          </div>
        </div>

        {/* title + sub */}
        <div className="text-center -mt-1">
          <p className="text-lg font-bold text-white tracking-tight mb-0.5">
            {STAGE_TITLE[stage]}
          </p>
          <p className="text-sm text-slate-500">
            {STAGES[activeIdx].sub}…
          </p>
        </div>

        {/* ── stage list ── */}
        <div className="login-loader-stages w-full">
          {STAGES.map(({ key, label }, i) => {
            const isDone   = i < activeIdx;
            const isActive = i === activeIdx;
            return (
              <div
                key={key}
                className={`login-loader-stage${isActive ? ' active' : isDone ? ' done' : ''}`}
              >
                {/* left icon */}
                <div className="login-loader-stage-icon">
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    : isActive
                      ? STAGE_ICON[key]
                      : <span className="w-5 h-5 rounded-full border-2 border-white/10 block" />
                  }
                </div>
                <span className="login-loader-stage-label">{label}</span>
                {isActive && (
                  <div className="ml-auto login-loader-dots" aria-hidden="true">
                    <span /><span /><span />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vimmik attribution */}
        <div className="flex items-center justify-center gap-1.5 -mt-1 opacity-40">
          <VimmikLogo className="w-4 h-4" />
          <span className="text-[11px] text-slate-500 font-medium">Secured by Vimmik</span>
        </div>
      </div>
    </div>
  );
}
