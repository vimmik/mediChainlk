'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
  useTenant,
  useCreateBranch,
  useDeactivateBranch,
  useUpdateTenant,
  type Branch,
} from '@/hooks/useTenants';
import {
  Plus,
  Pencil,
  MapPin,
  Phone,
  Users,
  Building2,
  Eye,
  PowerOff,
  GitBranch,
  UserCheck,
  Star,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

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
      <DialogContent className="max-w-lg glass-card border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Add Branch Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="b-name" className="text-slate-600 dark:text-slate-400 text-xs">Branch Name</Label>
              <input id="b-name" placeholder="e.g. ABC Colombo" {...register('name')} className="glass-input w-full" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="b-address" className="text-slate-600 dark:text-slate-400 text-xs">Address</Label>
              <input id="b-address" placeholder="123 Main Street, Colombo 03" {...register('address')} className="glass-input w-full" />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-city" className="text-slate-600 dark:text-slate-400 text-xs">City</Label>
              <input id="b-city" placeholder="Colombo" {...register('city')} className="glass-input w-full" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-district" className="text-slate-600 dark:text-slate-400 text-xs">District</Label>
              <input id="b-district" placeholder="Western (optional)" {...register('district')} className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-phone" className="text-slate-600 dark:text-slate-400 text-xs">Phone</Label>
              <input id="b-phone" placeholder="+94112345678" {...register('phone')} className="glass-input w-full" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-license" className="text-slate-600 dark:text-slate-400 text-xs">License No.</Label>
              <input id="b-license" placeholder="PH-LK-2024-001" {...register('licenseNo')} className="glass-input w-full" />
              {errors.licenseNo && <p className="text-xs text-red-500">{errors.licenseNo.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
              {isSubmitting ? 'Adding…' : 'Add Branch'}
            </Button>
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
    <div className="section-glass hover-lift group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/15 to-blue-500/15 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-500/70" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{branch.name}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {branch.city}{branch.district ? `, ${branch.district}` : ''}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          branch.isActive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
        }`}>
          <span className={`status-dot ${branch.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 mb-4">{branch.address}</div>

      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-4 pt-3 border-t border-white/10 dark:border-white/5">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{branch.phone}</span>
        <span className="font-mono flex items-center gap-1"><Star className="w-3 h-3" />{branch.licenseNo}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{branch._count?.staff ?? 0} staff</span>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/tenants/${tenantId}/branches/${branch.id}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
            <Eye className="w-3.5 h-3.5" />
            Manage Staff
          </Button>
        </Link>
        {branch.isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            onClick={() => deactivate.mutate(branch.id)}
            disabled={deactivate.isPending}
          >
            <PowerOff className="w-3.5 h-3.5" />
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
      <DialogContent className="max-w-md glass-card border-white/20 dark:border-white/10">
        <DialogHeader><DialogTitle className="text-slate-800 dark:text-slate-200">Edit Tenant</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-slate-600 dark:text-slate-400 text-xs">Brand Name</Label>
            <input {...register('name')} className="glass-input w-full" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-slate-600 dark:text-slate-400 text-xs">Slug</Label>
            <input {...register('slug')} className="glass-input w-full font-mono text-sm" />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
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
    return <DetailSkeleton sections={3} fieldsPerSection={4} />;
  }

  if (!tenant) {
    return (
      <div className="section-glass text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Tenant not found.</p>
        <Link href="/tenants" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
          Back to tenants
        </Link>
      </div>
    );
  }

  const initials = tenant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={tenant.name}
          breadcrumbs={[{ label: 'Tenants', href: '/tenants' }, { label: tenant.name }]}
          badge={
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              tenant.isActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
            }`}>
              <span className={`status-dot ${tenant.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
              {tenant.isActive ? 'Active' : 'Inactive'}
            </span>
          }
          action={
            <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2 rounded-xl">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          }
        />

        {/* Tenant header card */}
        <div className="section-glass flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-xl font-bold text-violet-600 dark:text-violet-400">
            {initials}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{tenant.name}</div>
            <div className="text-sm text-slate-400 dark:text-slate-500 font-mono">/{tenant.slug}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Branches', value: tenant._count?.branches ?? tenant.branches.length, icon: GitBranch, gradient: 'from-blue-500/15 to-cyan-500/15', iconColor: 'text-blue-500' },
            { label: 'Total Staff', value: tenant.branches.reduce((sum: number, b: Branch & { _count?: { staff: number } }) => sum + (b._count?.staff ?? 0), 0), icon: Users, gradient: 'from-violet-500/15 to-purple-500/15', iconColor: 'text-violet-500' },
            { label: 'Pharmacy Admins', value: tenant.users.length, icon: UserCheck, gradient: 'from-emerald-500/15 to-teal-500/15', iconColor: 'text-emerald-500' },
          ].map((stat) => (
            <div key={stat.label} className="stat-mini">
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['branches', 'admins'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize rounded-xl transition-all ${
                tab === t
                  ? 'bg-white/10 dark:bg-white/[0.08] text-slate-800 dark:text-white shadow-sm border border-white/20 dark:border-white/10'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/5'
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
              <Button onClick={() => setCreateBranchOpen(true)} className="gap-2 rounded-xl glow-blue">
                <Plus className="w-4 h-4" />
                Add Branch
              </Button>
            </div>
            {tenant.branches.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No branches yet"
                description="Add the first branch location for this pharmacy"
                action={
                  <Button onClick={() => setCreateBranchOpen(true)} className="gap-2 rounded-xl glow-blue">
                    <Plus className="w-4 h-4" />
                    Add Branch
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenant.branches.map((branch: Branch & { _count?: { staff: number } }) => (
                  <BranchCard key={branch.id} branch={branch} tenantId={id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admins tab */}
        {tab === 'admins' && (
          <div className="space-y-4">
            {tenant.users.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No pharmacy admins"
                description="No pharmacy admins assigned yet"
                action={
                  <Link href="/users">
                    <Button variant="outline" className="rounded-xl">Invite from Users</Button>
                  </Link>
                }
              />
            ) : (
              <div className="glass-table">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Status</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.users.map((u: { id: string; firstName?: string; lastName?: string; email?: string; isActive: boolean }) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500/15 to-teal-500/15 flex items-center justify-center text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              {([u.firstName, u.lastName].filter(Boolean).join(' ') || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="text-slate-400 dark:text-slate-500">{u.email ?? '—'}</td>
                        <td>
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className={`status-dot ${u.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
                            <span className={u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </span>
                        </td>
                        <td className="text-right">
                          <Link href={`/users/${u.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
