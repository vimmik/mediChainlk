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
  Label,
} from '@medichainlk/ui';
import {
  useBranch,
  useUpdateBranch,
  useDeactivateBranch,
  useReactivateBranch,
  useAssignBranchUser,
  useRemoveBranchUser,
  type BranchStaffMember,
} from '@/hooks/useTenants';
import { useUsers } from '@/hooks/useUsers';
import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  MapPin,
  Phone,
  Star,
  Users,
  Building2,
  Pencil,
  Power,
  PowerOff,
  UserPlus,
  UserMinus,
  Eye,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

// ─── Edit Branch Modal ────────────────────────────────────────────────────────

const editBranchSchema = z.object({
  name: z.string().min(2, 'Name required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  district: z.string().optional(),
  phone: z.string().min(7, 'Phone required'),
  licenseNo: z.string().min(3, 'License number required'),
});
type EditBranchForm = z.infer<typeof editBranchSchema>;

function EditBranchModal({
  tenantId,
  branchId,
  defaultValues,
  open,
  onClose,
}: {
  tenantId: string;
  branchId: string;
  defaultValues: EditBranchForm;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateBranch(tenantId, branchId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditBranchForm>({
    resolver: zodResolver(editBranchSchema),
    defaultValues,
  });

  const onSubmit = async (data: EditBranchForm) => {
    await update.mutateAsync(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg glass-card border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Edit Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Branch Name</Label>
              <input {...register('name')} className="glass-input w-full" placeholder="e.g. ABC Colombo" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Address</Label>
              <input {...register('address')} className="glass-input w-full" placeholder="123 Main Street, Colombo 03" />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">City</Label>
              <input {...register('city')} className="glass-input w-full" placeholder="Colombo" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">District</Label>
              <input {...register('district')} className="glass-input w-full" placeholder="Western (optional)" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Phone</Label>
              <input {...register('phone')} className="glass-input w-full" placeholder="+94112345678" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">License No.</Label>
              <input
                {...register('licenseNo')}
                className="glass-input w-full font-mono text-sm"
                placeholder="PH-LK-2024-001"
              />
              {errors.licenseNo && <p className="text-xs text-red-500">{errors.licenseNo.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Staff Modal ───────────────────────────────────────────────────────

const assignSchema = z.object({
  userId: z.string().min(1, 'Select a staff member'),
  isPrimary: z.boolean().optional(),
});
type AssignForm = z.infer<typeof assignSchema>;

function AssignStaffModal({
  tenantId,
  branchId,
  open,
  onClose,
}: {
  tenantId: string;
  branchId: string;
  open: boolean;
  onClose: () => void;
}) {
  const assign = useAssignBranchUser(tenantId, branchId);
  const { data: usersData } = useUsers({ tenantId, role: 'pharmacy_staff', isActive: true });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignForm>({ resolver: zodResolver(assignSchema) });

  const onSubmit = async (data: AssignForm) => {
    await assign.mutateAsync(data);
    reset();
    onClose();
  };

  const users = usersData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md glass-card border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Assign Staff to Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-slate-600 dark:text-slate-400 text-xs">Staff Member</Label>
            <select {...register('userId')} className="glass-input w-full text-sm">
              <option value="">— choose staff member —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                </option>
              ))}
            </select>
            {errors.userId && <p className="text-xs text-red-500">{errors.userId.message}</p>}
            {users.length === 0 && (
              <p className="text-xs text-slate-400">
                No available staff for this tenant.{' '}
                <Link href="/users" className="text-blue-500 hover:underline">
                  Invite staff first.
                </Link>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isPrimary"
              {...register('isPrimary')}
              className="w-4 h-4 rounded accent-blue-500"
            />
            <Label
              htmlFor="isPrimary"
              className="font-normal cursor-pointer text-slate-600 dark:text-slate-300 text-sm"
            >
              Set as primary branch for this staff member
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onClose(); }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || users.length === 0}
              className="rounded-xl glow-blue"
            >
              {isSubmitting ? 'Assigning…' : 'Assign Staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Row ────────────────────────────────────────────────────────────────

function StaffRow({
  member,
  tenantId,
  branchId,
}: {
  member: BranchStaffMember;
  tenantId: string;
  branchId: string;
}) {
  const remove = useRemoveBranchUser(tenantId, branchId);
  const [confirm, setConfirm] = useState(false);

  const fullName =
    [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || '—';
  const initials =
    fullName === '—'
      ? '?'
      : fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/15 to-blue-500/15 flex items-center justify-center text-[11px] font-bold text-violet-600 dark:text-violet-400 shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-medium text-slate-700 dark:text-slate-300">{fullName}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{member.user.email ?? '—'}</div>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400">
            {member.user.role.replace('_', ' ')}
          </span>
          {member.isPrimary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Star className="w-2.5 h-2.5" />
              Primary
            </span>
          )}
        </div>
      </td>
      <td>
        <span className="flex items-center gap-1.5 text-xs">
          <span
            className={`status-dot ${member.user.isActive ? 'status-dot-active' : 'status-dot-inactive'}`}
          />
          <span
            className={
              member.user.isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400'
            }
          >
            {member.user.isActive ? 'Active' : 'Inactive'}
          </span>
        </span>
      </td>
      <td className="text-xs text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(member.assignedAt).toLocaleDateString()}
        </span>
      </td>
      <td>
        {confirm ? (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-slate-400">Remove from branch?</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={() => remove.mutate(member.userId)}
              disabled={remove.isPending}
            >
              {remove.isPending ? '…' : 'Yes'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-lg text-xs"
              onClick={() => setConfirm(false)}
            >
              No
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/users/${member.userId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                title="View user"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
              title="Remove from branch"
              onClick={() => setConfirm(true)}
            >
              <UserMinus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BranchDetailPage() {
  const { id: tenantId, branchId } = useParams<{ id: string; branchId: string }>();
  const { data: branch, isLoading } = useBranch(tenantId, branchId);
  const deactivate = useDeactivateBranch(tenantId);
  const reactivate = useReactivateBranch(tenantId);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton sections={3} fieldsPerSection={4} />;
  }

  if (!branch) {
    return (
      <div className="section-glass text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Branch not found.</p>
        <Link
          href={`/tenants/${tenantId}`}
          className="text-blue-500 hover:underline text-sm mt-2 inline-block"
        >
          Back to tenant
        </Link>
      </div>
    );
  }

  const staffCount = branch.staff?.length ?? 0;
  const primaryStaff = branch.staff?.filter((m) => m.isPrimary).length ?? 0;
  const activeStaff = branch.staff?.filter((m) => m.user.isActive).length ?? 0;

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <PageHeader
          title={branch.name}
          breadcrumbs={[
            { label: 'Tenants', href: '/tenants' },
            { label: 'Tenant', href: `/tenants/${tenantId}` },
            { label: branch.name },
          ]}
          badge={
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                branch.isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span
                className={`status-dot ${
                  branch.isActive ? 'status-dot-active' : 'status-dot-inactive'
                }`}
              />
              {branch.isActive ? 'Active' : 'Inactive'}
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              {branch.isActive ? (
                <Button
                  variant="outline"
                  onClick={() => deactivate.mutate(branchId)}
                  disabled={deactivate.isPending}
                  className="gap-2 rounded-xl text-red-500 border-red-200 dark:border-red-900/40 hover:bg-red-500/10 hover:border-red-400"
                >
                  <PowerOff className="w-4 h-4" />
                  {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => reactivate.mutate(branchId)}
                  disabled={reactivate.isPending}
                  className="gap-2 rounded-xl text-emerald-600 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-500/10 hover:border-emerald-400"
                >
                  <Power className="w-4 h-4" />
                  {reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="gap-2 rounded-xl"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </div>
          }
        />

        {/* Branch info card */}
        <div className="section-glass">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {branch.name}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {branch.address}, {branch.city}
                  {branch.district ? `, ${branch.district}` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {branch.phone}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  {branch.licenseNo}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total Staff',
              value: staffCount,
              icon: Users,
              gradient: 'from-blue-500/15 to-cyan-500/15',
              iconColor: 'text-blue-500',
            },
            {
              label: 'Active Staff',
              value: activeStaff,
              icon: ShieldCheck,
              gradient: 'from-emerald-500/15 to-teal-500/15',
              iconColor: 'text-emerald-500',
            },
            {
              label: 'Primary Assigned',
              value: primaryStaff,
              icon: Star,
              gradient: 'from-amber-500/15 to-orange-500/15',
              iconColor: 'text-amber-500',
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-mini">
              <div
                className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center mb-3`}
              >
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Staff section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Assigned Staff
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Pharmacy staff assigned to this branch location
              </p>
            </div>
            <Button onClick={() => setAssignOpen(true)} className="gap-2 rounded-xl glow-blue">
              <UserPlus className="w-4 h-4" />
              Assign Staff
            </Button>
          </div>

          {staffCount === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff assigned"
              description="Assign pharmacy staff to this branch to get started"
              action={
                <Button
                  onClick={() => setAssignOpen(true)}
                  className="gap-2 rounded-xl glow-blue"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Staff
                </Button>
              }
            />
          ) : (
            <div className="glass-table">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Staff Member</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Assigned</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {branch.staff.map((m) => (
                    <StaffRow
                      key={m.id}
                      member={m}
                      tenantId={tenantId}
                      branchId={branchId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EditBranchModal
        tenantId={tenantId}
        branchId={branchId}
        defaultValues={{
          name: branch.name,
          address: branch.address,
          city: branch.city,
          district: branch.district ?? '',
          phone: branch.phone,
          licenseNo: branch.licenseNo,
        }}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

      <AssignStaffModal
        tenantId={tenantId}
        branchId={branchId}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
      />
    </>
  );
}
