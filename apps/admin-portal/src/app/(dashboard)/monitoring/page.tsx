import { Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Monitoring</h2>
        <p className="text-muted-foreground">Health checks and service status</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {['API Service', 'AI Service', 'Database'].map((service) => (
          <Card key={service}>
            <CardHeader>
              <CardTitle className="text-base">{service}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600 font-medium">Operational</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
