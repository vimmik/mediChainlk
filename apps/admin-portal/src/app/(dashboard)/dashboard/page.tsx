import { StatCard } from '@/components/shared/StatCard';
import { Activity, Building2, ClipboardList, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">System overview at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pharmacies"
          value="—"
          description="Active tenants on the platform"
          icon={Building2}
          variant="blue"
          delay={1}
        />
        <StatCard
          title="Orders Today"
          value="—"
          description="Across all pharmacies"
          icon={ShoppingCart}
          variant="teal"
          delay={2}
        />
        <StatCard
          title="Active Prescriptions"
          value="—"
          description="Awaiting pharmacist review"
          icon={ClipboardList}
          variant="orange"
          delay={3}
        />
        <StatCard
          title="System Health"
          value="OK"
          description="All services operational"
          icon={Activity}
          variant="emerald"
          delay={4}
        />
      </div>
    </div>
  );
}

