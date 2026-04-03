import { StatCard } from '@/components/shared/StatCard';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">System overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pharmacies"
          value="—"
          description="Active tenants on the platform"
        />
        <StatCard
          title="Orders Today"
          value="—"
          description="Across all pharmacies"
        />
        <StatCard
          title="Active Prescriptions"
          value="—"
          description="Awaiting pharmacist review"
        />
        <StatCard
          title="System Health"
          value="OK"
          description="All services operational"
        />
      </div>
    </div>
  );
}
