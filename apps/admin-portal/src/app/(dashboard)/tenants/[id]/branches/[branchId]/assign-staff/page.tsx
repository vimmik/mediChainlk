'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import {
  useAssignBranchUser,
  useBranch,
  useRemoveBranchUser,
  useTenant,
  type BranchStaffMember,
} from '@/hooks/useTenants';
import { useUsers, type User } from '@/hooks/useUsers';
import { Button } from '@medichainlk/ui';
import {
  ArrowLeft,
  Calendar,
  Search,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// ─── Architecture note ────────────────────────────────────────────────────────
// pharmacy_admin   → implicit access to ALL branches; no UserBranchAssignment row needed.
// pharmacy_staff   → explicit assignment per branch via UserBranchAssignment.
// This page only manages pharmacy_staff assignments.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Available Staff Card ─────────────────────────────────────────────────────

function AvailableStaffCard({
  user,
  tenantId,
  branchId,
}: {
  user: User;
  tenantId: string;
  branchId: string;
}) {
  const assign = useAssignBranchUser(tenantId, branchId);
  const [isPrimary, setIsPrimary] = useState(false);

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
  const initials =
    fullName === '—'
      ? '?'
      : fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 dark:border-white/5 bg-white/3 hover:bg-white/5 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate">{fullName}</div>
        <div className="text-xs text-slate-400 truncate">{user.email ?? '—'}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-amber-500"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Primary</span>
        </label>
        <Button
          size="sm"
          disabled={assign.isPending}
          onClick={() => assign.mutate({ userId: user.id, isPrimary })}
          className="h-8 px-3 rounded-lg text-xs glow-blue"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          {assign.isPending ? '…' : 'Assign'}
        </Button>
      </div>
    </div>
  );
}

// ─── Assigned Staff Row ───────────────────────────────────────────────────────

function AssignedStaffRow({
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

  const fullName = [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || '—';
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
            <div className="text-xs text-slate-400">{member.user.email ?? '—'}</div>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-1.5">
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
          <span className={`status-dot ${member.user.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
          <span className={member.user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
            {member.user.isActive ? 'Active' : 'Inactive'}
          </span>
        </span>
      </td>
      <td className="text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(member.assignedAt).toLocaleDateString()}
        </span>
      </td>
      <td>
        {confirm ? (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-slate-400">Remove?</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10"
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
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-500"
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

export default function AssignStaffPage() {
  const { id: tenantId, branchId } = useParams<{ id: string; branchId: string }>();
  const router = useRouter();
  const { data: tenant } = useTenant(tenantId);
  const { data: branch, isLoading: branchLoading } = useBranch(tenantId, branchId);

  // Fetch ALL pharmacy_staff for this tenant (limit=200 covers typical pharmacy sizes)
  const { data: staffData, isLoading: staffLoading } = useUsers({
    tenantId,
    role: 'pharmacy_staff',
    limit: 200,
  });

  const [search, setSearch] = useState('');

  const allStaff = useMemo(() => staffData?.data ?? [], [staffData?.data]);
  const assignedStaff = useMemo(() => branch?.staff ?? [], [branch?.staff]);

  // Assigned user IDs for fast lookup
  const assignedIds = useMemo(
    () => new Set(assignedStaff.map((m) => m.userId)),
    [assignedStaff],
  );

  // Available = tenant's pharmacy_staff not yet assigned to this branch
  const availableStaff = useMemo(
    () => allStaff.filter((u) => !assignedIds.has(u.id)),
    [allStaff, assignedIds],
  );

  // Filter available by search query
  const filteredAvailable = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableStaff;
    return availableStaff.filter((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
      return name.includes(q) || (u.email ?? '').toLowerCase().includes(q);
    });
  }, [availableStaff, search]);

  if (branchLoading || staffLoading) {
    return <DetailSkeleton sections={2} fieldsPerSection={4} />;
  }

  if (!branch) {
    return (
      <div className="section-glass text-center py-20">
        <p className="text-slate-500">Branch not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Staff"
        breadcrumbs={[
          { label: 'Tenants', href: '/tenants' },
          { label: tenant?.name ?? '…', href: `/tenants/${tenantId}` },
          { label: branch.name, href: `/tenants/${tenantId}/branches/${branchId}` },
          { label: 'Assign Staff' },
        ]}
        action={
          <Button
            variant="outline"
            onClick={() => router.push(`/tenants/${tenantId}/branches/${branchId}`)}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Done
          </Button>
        }
      />

      {/* Info banner */}
      <div className="section-glass !py-3 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <span>
          Only <span className="font-medium text-slate-600 dark:text-slate-300">Pharmacy Staff</span> members
          need explicit branch assignments. Pharmacy Admins have implicit access to all branches under their tenant.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Available Staff ─────────────────────────────────────── */}
        <div className="section-glass space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              Available Staff
              {availableStaff.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {availableStaff.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pharmacy staff in this tenant not yet assigned to this branch
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-9 text-sm"
            />
          </div>

          {filteredAvailable.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? 'No matches' : 'All staff assigned'}
              description={
                search
                  ? 'Try a different search term'
                  : availableStaff.length === 0
                  ? 'All pharmacy staff for this tenant are already assigned to this branch'
                  : 'Clear the search to see available staff'
              }
              action={
                availableStaff.length === 0 && !search ? (
                  <Link href="/users">
                    <Button variant="outline" size="sm" className="rounded-xl gap-2">
                      <UserPlus className="w-4 h-4" />
                      Invite Staff
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
              {filteredAvailable.map((user) => (
                <AvailableStaffCard
                  key={user.id}
                  user={user}
                  tenantId={tenantId}
                  branchId={branchId}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Currently Assigned ──────────────────────────────────── */}
        <div className="section-glass space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              Currently Assigned
              {assignedStaff.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {assignedStaff.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Staff currently assigned to this branch location
            </p>
          </div>

          {assignedStaff.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff assigned"
              description="Use the panel on the left to assign pharmacy staff to this branch"
            />
          ) : (
            <div className="glass-table max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Staff Member</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Since</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assignedStaff.map((m) => (
                    <AssignedStaffRow
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
    </div>
  );
}
