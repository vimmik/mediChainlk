'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Badge, Skeleton } from '@medichainlk/ui';
import { useUser } from '@/hooks/useUsers';
import { EditUserDrawer } from '@/components/users/EditUserDrawer';

const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  system_admin:   { label: 'System Admin',   variant: 'default' },
  pharmacy_admin: { label: 'Pharmacy Admin', variant: 'default' },
  pharmacy_staff: { label: 'Pharmacy Staff', variant: 'outline' },
  customer:       { label: 'Customer',       variant: 'secondary' },
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</dt>
      <dd className="text-sm">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        User not found.{' '}
        <Link href="/users" className="underline">Back to users</Link>
      </div>
    );
  }

  const roleCfg = ROLE_BADGE[user.role] ?? { label: user.role, variant: 'secondary' as const };

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/users" className="text-muted-foreground hover:text-foreground text-sm">
              ← Users
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">
              {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User'}
            </h2>
            <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
            <Badge variant={user.isActive ? 'default' : 'secondary'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <Button onClick={() => setEditOpen(true)}>Edit</Button>
        </div>

        {/* Profile sections */}
        <div className="rounded-lg border p-5 space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Personal Information</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="First name" value={user.firstName} />
            <Field label="Last name" value={user.lastName} />
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone} />
            <Field label="NIC" value={user.nic} />
            <Field label="Gender" value={user.gender} />
            <Field label="Date of birth" value={user.birthday ? new Date(user.birthday).toLocaleDateString() : null} />
            <Field label="Height" value={user.height ? `${user.height} cm` : null} />
            <Field label="Weight" value={user.weight ? `${user.weight} kg` : null} />
          </dl>
        </div>

        <div className="rounded-lg border p-5 space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Address</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Address line 1" value={user.addressLine1} />
            <Field label="Address line 2" value={user.addressLine2} />
            <Field label="Address line 3" value={user.addressLine3} />
            <Field label="District" value={user.district} />
            <Field label="Postal code" value={user.postalCode} />
          </dl>
        </div>

        <div className="rounded-lg border p-5 space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Account</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Role" value={roleCfg.label} />
            <Field label="Tenant" value={(user as { tenant?: { name?: string } }).tenant?.name} />
            <Field label="Firebase UID" value={user.firebaseUid} />
            <Field label="Created" value={new Date(user.createdAt).toLocaleString()} />
            <Field label="Last updated" value={new Date(user.updatedAt).toLocaleString()} />
          </dl>
        </div>

        {(user as { branchAssignments?: { id: string; isPrimary: boolean; branch: { id: string; name: string; city: string } }[] }).branchAssignments?.length ? (
          <div className="rounded-lg border p-5 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Branch Assignments</h3>
            <div className="space-y-2">
              {(user as { branchAssignments: { id: string; isPrimary: boolean; branch: { id: string; name: string; city: string } }[] }).branchAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{a.branch.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{a.branch.city}</span>
                    {a.isPrimary && <Badge variant="secondary">Primary</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <EditUserDrawer user={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
