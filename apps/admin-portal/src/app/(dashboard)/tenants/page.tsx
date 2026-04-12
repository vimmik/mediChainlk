'use client';

import { useState } from 'react';
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
  useTenants,
  useCreateTenant,
  useDeactivateTenant,
  useReactivateTenant,
  type Tenant,
} from '@/hooks/useTenants';

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateTenantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateTenant();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const nameValue = watch('name');

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const onSubmit = async (data: CreateForm) => {
    await create.mutateAsync(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pharmacy Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Pharmacy Brand Name</Label>
            <Input
              id="name"
              placeholder="e.g. ABC Pharmacy"
              {...register('name', {
                onChange: (e) => setValue('slug', autoSlug(e.target.value)),
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="abc-pharmacy"
              {...register('slug')}
              className="font-mono text-sm"
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-muted-foreground">Auto-generated from name. Used in URLs.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TenantRow({ tenant }: { tenant: Tenant }) {
  const deactivate = useDeactivateTenant();
  const reactivate = useReactivateTenant();

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">{tenant.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{tenant.slug}</div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {tenant._count?.branches ?? 0} branches
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {tenant._count?.users ?? 0} admins
      </td>
      <td className="px-4 py-3">
        <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
          {tenant.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(tenant.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/tenants/${tenant.id}`}>
            <Button variant="outline" size="sm">Manage</Button>
          </Link>
          {tenant.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => deactivate.mutate(tenant.id)}
              disabled={deactivate.isPending}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => reactivate.mutate(tenant.id)}
              disabled={reactivate.isPending}
            >
              Reactivate
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pharmacy Tenants</h2>
          <p className="text-muted-foreground">
            Manage pharmacy brands and their branch locations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ New Tenant</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pharmacy</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Branches</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Admins</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(tenants ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No tenants yet. Create your first pharmacy tenant.
                  </td>
                </tr>
              ) : (
                (tenants ?? []).map((t) => <TenantRow key={t.id} tenant={t} />)
              )}
            </tbody>
          </table>
        </div>
      )}

      <CreateTenantModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
