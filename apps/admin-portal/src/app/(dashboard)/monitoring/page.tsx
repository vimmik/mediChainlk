import { Server, Brain, Database, Wifi, Clock, Activity } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

const SERVICES = [
  {
    name: 'API Service',
    description: 'NestJS backend — port 3001',
    icon: Server,
    status: 'operational' as const,
    uptime: '99.98%',
    latency: '42ms',
    gradient: 'from-blue-500/15 to-cyan-500/15',
    iconColor: 'text-blue-500',
  },
  {
    name: 'AI Service',
    description: 'FastAPI OCR/NLP — port 8000',
    icon: Brain,
    status: 'operational' as const,
    uptime: '99.92%',
    latency: '380ms',
    gradient: 'from-violet-500/15 to-purple-500/15',
    iconColor: 'text-violet-500',
  },
  {
    name: 'Database',
    description: 'PostgreSQL — port 5432',
    icon: Database,
    status: 'operational' as const,
    uptime: '100%',
    latency: '3ms',
    gradient: 'from-emerald-500/15 to-teal-500/15',
    iconColor: 'text-emerald-500',
  },
];

const STATUS_MAP = {
  operational: { dot: 'status-dot-active', label: 'Operational', color: 'text-emerald-600 dark:text-emerald-400' },
  degraded:    { dot: 'status-dot-warning', label: 'Degraded',    color: 'text-amber-600 dark:text-amber-400' },
  down:        { dot: 'status-dot-error',   label: 'Down',        color: 'text-red-600 dark:text-red-400' },
};

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Monitoring"
        description="Health checks and service status"
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="status-dot status-dot-active" />
            All systems operational
          </span>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {SERVICES.map((svc) => {
          const st = STATUS_MAP[svc.status];
          return (
            <div key={svc.name} className="section-glass hover-lift group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${svc.gradient} flex items-center justify-center`}>
                  <svc.icon className={`w-5 h-5 ${svc.iconColor}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`status-dot ${st.dot}`} />
                  <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{svc.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{svc.description}</p>

              {/* Metrics */}
              <div className="mt-5 pt-4 border-t border-white/10 dark:border-white/5 grid grid-cols-3 gap-3">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-slate-400" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Uptime</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{svc.uptime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Latency</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{svc.latency}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-slate-400" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</div>
                    <div className={`text-sm font-semibold ${st.color}`}>OK</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
