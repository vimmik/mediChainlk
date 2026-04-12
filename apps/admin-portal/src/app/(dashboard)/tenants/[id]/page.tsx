'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Badge,
  Button,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@medichainlk/ui';
import {
  useTenant,
  useCreateBranch,
  useDeactivateBranch,
  useUpdateTenant,
  type Branch,
} from '@/hooks/useTenants';

// ─── Create Branch Modal ────────────────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(2, 'Name required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  district: z.string().optional(),
  phone: z.string().min(7, 'Phone required'),
  licenseNo: z.string().min(3, 'License number required'),
});
type BranchForm = z.infer<typeof branchSchema>;

function CreateBranchModal({ tenantId, open, onClose }: { tenantId: string; open: boolean; onClose: () => void }) {
  const create = useCreateBranch(tenantId);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
  });

  const onSubmit = async (data: BranchForm) => {
    await create.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Branch Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="b-name">Branch Name</Label>
              <Input id="b-name" placeholder="e.g. ABC Colombo" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="b-address">Address</Label>
              <Input id="b-address" placeholder="123 Main Street, Colombo 03" {...register('address')} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="b-city">City</Label>
              <Input id="b-city" placeholder="Colombo" {...register('city')} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="b-district">District</Label>
              <Input id="b-district" placeholder="Western (optional)" {...register('district')} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="b-phone">Phone</Label>
              <Input id="b-phone" placeholder="+94112345678" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="b-license">License No.</Label>
              <Input id="b-license" placeholder="PH-LK-2024-001" {...register('licenseNo')} />
              {errors.licenseNo && <p className="text-xs text-destructive">{errors.licenseNo.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add Branch'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Branch Card ────────────────────────────────────────────────────────────

function BranchCard({ branch, tenantId }: { branch: Branch & { _count?: { staff: number } }; tenantId: string }) {
  const deactivate = useDeactivateBranch(tenantId);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{branch.name}</div>
          <div className="text-sm text-muted-foreground">{branch.address}</div>
          <div className="text-sm text-muted-foreground">{branch.city}{branch.district ? `, ${branch.district}` : ''}</div>
        </div>
        <Badge variant={branch.isActive ? 'default' : 'secondary'}>
          {branch.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Phone: {branch.phone}</span>
        <span className="font-mono">License: {branch.licenseNo}</span>
        <span>{branch._count?.staff ?? 0} staff</span>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/tenants/${tenantId}/branches/${branch.id}`}>
          <Button variant="outline" size="sm">Manage Staff</Button>
        </Link>
        {branch.isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => deactivate.mutate(branch.id)}
            disabled={deactivate.isPending}
          >
            Deactivate
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Edit Tenant Modal ───────────────────────────────────────────────────────

const editTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
});
type EditTenantForm = z.infer<typeof editTenantSchema>;

function EditTenantModal({ tenantId, defaultValues, open, onClose }: {
  tenantId: string;
  defaultValues: { name: string; slug: string };
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateTenant(tenantId);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditTenantForm>({
    resolver: zodResolver(editTenantSchema),
    defaultValues,
  });

  const onSubmit = async (data: EditTenantForm) => {
    await update.mutateAsync(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Tenant</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Brand Name</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input {...register('slug')} className="font-mono text-sm" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Tab = 'branches' | 'admins';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading } = useTenant(id);
  const [tab, setTab] = useState<Tab>('branches');
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Tenant not found.{' '}
        <Link href="/tenants" className="underline">Back to tenants</Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tenants" className="text-muted-foreground hover:text-foreground text-sm">
              ← Tenants
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{tenant.name}</h2>
                <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">/{tenant.slug}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Tenant</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{tenant._count?.branches ?? tenant.branches.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Branches</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">
              {tenant.branches.reduce((sum, b) => sum + (b._count?.staff ?? 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Total Staff</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-3xl font-bold">{tenant.users.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Pharmacy Admins</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {(['branches', 'admins'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'branches' ? `Branches (${tenant.branches.length})` : `Admins (${tenant.users.length})`}
            </button>
          ))}
        </div>

        {/* Branches tab */}
        {tab === 'branches' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setCreateBranchOpen(true)}>+ Add Branch</Button>
            </div>
            {tenant.branches.length === 0 ? (
              <div className="text-center py-12 border rounded-lg text-muted-foreground">
                No branches yet. Add the first branch location.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenant.branches.map((branch) => (
                  <BranchCard key={branch.id} branch={branch} tenantId={id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins tab */}
        {tab === 'admins' && (
          <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tenant.users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        No pharmacy admins assigned yet.{' '}
                        <Link href="/users" className="underline">Invite one from Users</Link>
                      </td>
                    </tr>
                  ) : (
                    tenant.users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? 'default' : 'secondary'}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/users/${u.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateBranchModal
        tenantId={id}
        open={createBranchOpen}
        onClose={() => setCreateBranchOpen(false)}
      />

      <EditTenantModal
        tenantId={id}
        defaultValues={{ name: tenant.name, slug: tenant.slug }}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
