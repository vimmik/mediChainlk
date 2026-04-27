'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import {
  useBranch,
  useDeactivateBranch,
  useReactivateBranch,
  useRemoveBranchUser,
  type BranchStaffMember,
} from '@/hooks/useTenants';
import { Button } from '@medichainlk/ui';
import {
  Building2,
  Calendar,
  Clock,
  Eye,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  PowerOff,
  ShieldCheck,
  Star,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

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
      : fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

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
  const router = useRouter();
  const { data: branch, isLoading } = useBranch(tenantId, branchId);
  const deactivate = useDeactivateBranch(tenantId);
  const reactivate = useReactivateBranch(tenantId);

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
              onClick={() => router.push(`/tenants/${tenantId}/branches/${branchId}/edit`)}
              className="gap-2 rounded-xl"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Branch info card */}
      <div className="section-glass space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              {branch.name}
              {branch.isMainBranch && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            </div>
            {branch.branchCode && (
              <div className="text-xs text-slate-400 font-mono mt-0.5">{branch.branchCode}</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-white/10 dark:border-white/5 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">Address</div>
              <div className="text-slate-600 dark:text-slate-300">
                {[branch.address, branch.addressLine2].filter(Boolean).join(', ')}
                {branch.city && <>, {branch.city}</>}
                {branch.district && <>, {branch.district}</>}
                {branch.province && <>, {branch.province}</>}
                {branch.postalCode && <> {branch.postalCode}</>}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">{branch.phone}</span>
            </div>
            {branch.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">{branch.email}</span>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">License</div>
              <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">{branch.licenseNo}</div>
              {branch.licenseExpiry && (
                <div className="text-xs text-slate-400">Expires {new Date(branch.licenseExpiry).toLocaleDateString()}</div>
              )}
            </div>
          </div>
          {(branch.pharmacistName || branch.pharmacistRegNo) && (
            <div className="flex items-start gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">Pharmacist</div>
                {branch.pharmacistName && <div className="text-slate-600 dark:text-slate-300">{branch.pharmacistName}</div>}
                {branch.pharmacistRegNo && <div className="text-xs text-slate-400 font-mono">{branch.pharmacistRegNo}</div>}
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-0.5">Hours</div>
              <div className="text-slate-600 dark:text-slate-300">
                {branch.isOpen24h
                  ? 'Open 24 hours'
                  : branch.openingTime && branch.closingTime
                  ? `${branch.openingTime} – ${branch.closingTime}`
                  : 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: staffCount, icon: Users, gradient: 'from-blue-500/15 to-cyan-500/15', iconColor: 'text-blue-500' },
          { label: 'Active Staff', value: activeStaff, icon: ShieldCheck, gradient: 'from-emerald-500/15 to-teal-500/15', iconColor: 'text-emerald-500' },
          { label: 'Primary Assigned', value: primaryStaff, icon: Star, gradient: 'from-amber-500/15 to-orange-500/15', iconColor: 'text-amber-500' },
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
          <Button
            onClick={() => router.push(`/tenants/${tenantId}/branches/${branchId}/assign-staff`)}
            className="gap-2 rounded-xl glow-blue"
          >
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
                onClick={() => router.push(`/tenants/${tenantId}/branches/${branchId}/assign-staff`)}
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
  );
}
