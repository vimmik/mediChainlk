import { cn } from '@/lib/utils';

type Variant = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray' | 'orange';

const V: Record<Variant, string> = {
  green:  'bg-green-100 text-green-700 ring-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  red:    'bg-red-100 text-red-700 ring-red-200',
  blue:   'bg-blue-100 text-blue-700 ring-blue-200',
  purple: 'bg-purple-100 text-purple-700 ring-purple-200',
  gray:   'bg-slate-100 text-slate-600 ring-slate-200',
  orange: 'bg-orange-100 text-orange-700 ring-orange-200',
};

export function Badge({ label, variant }: { label: string; variant: Variant }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1', V[variant])}>
      {label}
    </span>
  );
}

export function ConfidenceBadge({ tier, pct }: { tier: string; pct: number }) {
  const v: Variant = tier === 'HIGH' ? 'green' : tier === 'MEDIUM' ? 'yellow' : 'red';
  return <Badge label={`${tier} — ${Math.round(pct * 100)}%`} variant={v} />;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    DELIVERED: 'green', CONFIRMED: 'green', ok: 'green',
    DISPATCHED: 'blue', IN_TRANSIT: 'blue', PREPARING: 'blue',
    PENDING_REVIEW: 'yellow', PENDING: 'yellow', low: 'yellow',
    REJECTED: 'red', FAILED: 'red', critical: 'red',
    PRESCRIPTION_CONFIRMED: 'purple', READY_FOR_PICKUP: 'purple',
  };
  const label = status.replace(/_/g, ' ');
  return <Badge label={label} variant={map[status] ?? 'gray'} />;
}
