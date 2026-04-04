import { Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Today&apos;s Summary</h2>
        <p className="text-muted-foreground">Pharmacy performance overview</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Prescriptions to Review', value: '—' },
          { title: 'Orders in Progress', value: '—' },
          { title: 'Low Stock Items', value: '—' },
          { title: 'Revenue Today', value: '—' },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
