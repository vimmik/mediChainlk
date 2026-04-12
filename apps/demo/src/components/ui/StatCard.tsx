import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const COLOR = {
  blue:   { icon: 'bg-blue-100 text-blue-600',    accent: 'stat-accent-blue',   ring: 'ring-blue-100'  },
  green:  { icon: 'bg-green-100 text-green-600',  accent: 'stat-accent-green',  ring: 'ring-green-100' },
  amber:  { icon: 'bg-amber-100 text-amber-600',  accent: 'stat-accent-amber',  ring: 'ring-amber-100' },
  red:    { icon: 'bg-red-100 text-red-600',       accent: 'stat-accent-red',    ring: 'ring-red-100'   },
  purple: { icon: 'bg-purple-100 text-purple-600', accent: 'stat-accent-purple', ring: 'ring-purple-100'},
};

export function StatCard({ title, value, sub, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const c = COLOR[color];
  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 p-5 shadow-sm',
      'hover:shadow-md transition-all duration-200 group',
      c.accent,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-none">{title}</p>
          <p className="text-[1.65rem] font-bold text-slate-900 mt-2 tabular-nums leading-none">{value}</p>
          {sub && (
            <p className="text-xs text-slate-500 mt-1.5 leading-snug">{sub}</p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold mt-2.5 px-2 py-1 rounded-lg',
              trend.up
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600',
            )}>
              {trend.up
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {trend.value}
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
          'ring-4 transition-transform duration-200 group-hover:scale-110',
          c.icon, c.ring,
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
