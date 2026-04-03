'use client';

import { useTenants } from '@/hooks/useTenants';
import { DataTable } from '@/components/shared/DataTable';
import { Badge, Button, Skeleton } from '@medichainlk/ui';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

const columns: ColumnDef<Tenant>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Link href={`/tenants/${row.original.id}`}>
        <Button variant="ghost" size="sm">View</Button>
      </Link>
    ),
  },
];

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pharmacies</h2>
          <p className="text-muted-foreground">Manage pharmacy tenants</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable columns={columns} data={tenants ?? []} />
      )}
    </div>
  );
}
