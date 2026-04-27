type Variant = 'blue' | 'teal' | 'emerald' | 'orange' | 'rose' | 'violet';

const variantMap: Record<Variant, string> = {
  blue:    'badge-blue',
  teal:    'badge-teal',
  emerald: 'badge-emerald',
  orange:  'badge-orange',
  rose:    'badge-rose',
  violet:  'badge-violet',
};

const delayMap: Record<number, string> = {
  0: '',
  1: 'animate-card-d1',
  2: 'animate-card-d2',
  3: 'animate-card-d3',
  4: 'animate-card-d4',
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: Variant;
  delay?: 0 | 1 | 2 | 3 | 4;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'blue',
  delay = 0,
}: StatCardProps) {
  const badgeCls = variantMap[variant];
  const delayCls = delayMap[delay];

  return (
    <div className={`glass-card hover-lift animate-card rounded-2xl p-5 ${delayCls}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5 leading-snug">{description}</p>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 w-11 h-11 rounded-xl ${badgeCls} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
