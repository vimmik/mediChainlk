import { Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Tenant Detail</h2>
      <Card>
        <CardHeader>
          <CardTitle>Tenant ID: {params.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tenant details will be loaded here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
