'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
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
import { Building2, Plus, Settings, MapPin, Users, Calendar, Power, PowerOff } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TopProgressBar } from '@/components/shared/TopProgressBar';

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
      <DialogContent className="max-w-md glass-card border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-white">Create Pharmacy Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-slate-600 dark:text-slate-300">Pharmacy Brand Name</Label>
            <Input
              id="name"
              placeholder="e.g. ABC Pharmacy"
              className="glass-input"
              {...register('name', {
                onChange: (e) => setValue('slug', autoSlug(e.target.value)),
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug" className="text-slate-600 dark:text-slate-300">Slug</Label>
            <Input
              id="slug"
              placeholder="abc-pharmacy"
              {...register('slug')}
              className="glass-input font-mono text-sm"
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            <p className="text-xs text-slate-400">Auto-generated from name. Used in URLs.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
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
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400">
            {tenant.name[0]?.toUpperCase() ?? 'T'}
          </div>
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{tenant.name}</div>
            <div className="text-xs text-slate-400 font-mono">/{tenant.slug}</div>
          </div>
        </div>
      </td>
      <td className="text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {tenant._count?.branches ?? 0}
        </div>
      </td>
      <td className="text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {tenant._count?.users ?? 0}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${tenant.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
          <span className={`text-xs font-medium ${tenant.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {tenant.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>
      <td className="text-slate-400 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(tenant.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/tenants/${tenant.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10" title="Manage">
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {tenant.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-red-500/10 hover:text-destructive"
              onClick={() => deactivate.mutate(tenant.id)}
              disabled={deactivate.isPending}
              title="Deactivate"
            >
              <PowerOff className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10"
              onClick={() => reactivate.mutate(tenant.id)}
              disabled={reactivate.isPending}
              title="Reactivate"
            >
              <Power className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function TenantsPage() {
  const { data: tenants, isLoading, isFetching } = useTenants();
  const [createOpen, setCreateOpen] = useState(false);
  const tenantList = tenants ?? [];

  return (
    <div className="space-y-6">
      <TopProgressBar loading={isFetching && !isLoading} />

      <PageHeader
        title="Pharmacy Tenants"
        description={`${tenantList.length > 0 ? `${tenantList.length} registered pharmacies` : 'Manage pharmacy brands and their branch locations'}`}
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2 glow-blue rounded-xl">
            <Plus className="w-4 h-4" />
            New Tenant
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : tenantList.length === 0 ? (
        <div className="glass-table">
          <EmptyState
            icon={Building2}
            title="No tenants yet"
            description="Create your first pharmacy tenant to get started"
            action={
              <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> Create Tenant
              </Button>
            }
          />
        </div>
      ) : (
        <div className="glass-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Pharmacy</th>
                <th className="text-left">Branches</th>
                <th className="text-left">Admins</th>
                <th className="text-left">Status</th>
                <th className="text-left">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenantList.map((t) => <TenantRow key={t.id} tenant={t} />)}
            </tbody>
          </table>
        </div>
      )}

      <CreateTenantModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
