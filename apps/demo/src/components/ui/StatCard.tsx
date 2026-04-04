import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const COLOR = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
    gradient: 'from-blue-50/60 to-transparent',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
    gradient: 'from-green-50/60 to-transparent',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    text: 'text-amber-600',
    gradient: 'from-amber-50/60 to-transparent',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
    gradient: 'from-red-50/60 to-transparent',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
    gradient: 'from-purple-50/60 to-transparent',
  },
};

export function StatCard({ title, value, sub, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const c = COLOR[color];
  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 p-5 card-shadow hover:card-shadow-lg transition-all',
      'bg-gradient-to-br',
      c.gradient,
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums transition-all">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold mt-1.5 px-1.5 py-0.5 rounded-md',
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
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
