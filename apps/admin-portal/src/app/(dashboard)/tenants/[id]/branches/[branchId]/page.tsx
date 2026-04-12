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
  useBranch,
  useAssignBranchUser,
  useRemoveBranchUser,
  type BranchStaffMember,
} from '@/hooks/useTenants';
import { useUsers } from '@/hooks/useUsers';

// ─── Assign User Modal ───────────────────────────────────────────────────────

const assignSchema = z.object({
  userId: z.string().min(1, 'Select a user'),
  isPrimary: z.boolean().optional(),
});
type AssignForm = z.infer<typeof assignSchema>;

function AssignUserModal({
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
  });

  const onSubmit = async (data: AssignForm) => {
    await assign.mutateAsync(data);
    reset();
    onClose();
  };

  const users = usersData?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Staff to Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="userId">Select Staff Member</Label>
            <select
              id="userId"
              {...register('userId')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— choose staff member —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                </option>
              ))}
            </select>
            {errors.userId && <p className="text-xs text-destructive">{errors.userId.message}</p>}
            {users.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No available staff for this tenant.{' '}
                <Link href="/users" className="underline">Invite staff first.</Link>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPrimary" {...register('isPrimary')} className="w-4 h-4" />
            <Label htmlFor="isPrimary" className="font-normal cursor-pointer">
              Set as primary branch for this staff member
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || users.length === 0}>
              {isSubmitting ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Row ───────────────────────────────────────────────────────────────

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

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium">
          {[member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || '—'}
        </div>
        <div className="text-xs text-muted-foreground">{member.user.email ?? '—'}</div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline">{member.user.role}</Badge>
        {member.isPrimary && (
          <Badge variant="secondary" className="ml-1">Primary</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={member.user.isActive ? 'default' : 'secondary'}>
          {member.user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(member.assignedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        {confirm ? (
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-muted-foreground">Remove from branch?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => remove.mutate(member.userId)}
              disabled={remove.isPending}
            >
              Yes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>No</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-end">
            <Link href={`/users/${member.userId}`}>
              <Button variant="ghost" size="sm">View</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirm(true)}
            >
              Remove
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BranchDetailPage() {
  const { id: tenantId, branchId } = useParams<{ id: string; branchId: string }>();
  const { data: branch, isLoading } = useBranch(tenantId, branchId);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Branch not found.{' '}
        <Link href={`/tenants/${tenantId}`} className="underline">Back to tenant</Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/tenants" className="text-muted-foreground hover:text-foreground">Tenants</Link>
          <span className="text-muted-foreground">/</span>
          <Link href={`/tenants/${tenantId}`} className="text-muted-foreground hover:text-foreground">
            Tenant
          </Link>
          <span className="text-muted-foreground">/</span>
          <span>{branch.name}</span>
        </div>

        {/* Branch info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{branch.name}</h2>
              <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                {branch.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {branch.address}, {branch.city}
              {branch.district ? `, ${branch.district}` : ''}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-lg border p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phone</div>
            <div>{branch.phone}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">License No.</div>
            <div className="font-mono">{branch.licenseNo}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Staff Assigned</div>
            <div>{branch.staff?.length ?? 0}</div>
          </div>
        </div>

        {/* Staff table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Assigned Staff</h3>
            <Button size="sm" onClick={() => setAssignOpen(true)}>+ Assign Staff</Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff Member</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assigned</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {!branch.staff || branch.staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      No staff assigned to this branch yet.
                    </td>
                  </tr>
                ) : (
                  branch.staff.map((m) => (
                    <StaffRow key={m.id} member={m} tenantId={tenantId} branchId={branchId} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AssignUserModal
        tenantId={tenantId}
        branchId={branchId}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
      />
    </>
  );
}
