import { Card, CardContent, CardHeader, CardTitle } from '@medichainlk/ui';

type Params = Promise<{ id: string }>;

export default async function TenantDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Tenant Detail</h2>
      <Card>
        <CardHeader>
          <CardTitle>Tenant ID: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tenant details will be loaded here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
