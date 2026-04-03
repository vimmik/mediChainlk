import Link from 'next/link';
import { Button } from '@medichainlk/ui';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">Stock levels and management</p>
        </div>
        <Link href="/inventory/alerts">
          <Button variant="outline">View Low Stock Alerts</Button>
        </Link>
      </div>
    </div>
  );
}
