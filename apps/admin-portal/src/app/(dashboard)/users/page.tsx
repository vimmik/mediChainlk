'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { Button, Badge, Skeleton } from '@medichainlk/ui';
import { useUsers, type User } from '@/hooks/useUsers';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { EditUserDrawer } from '@/components/users/EditUserDrawer';
import { useDeactivateUser, useReactivateUser } from '@/hooks/useUsers';
import Link from 'next/link';

const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  system_admin:    { label: 'System Admin',    variant: 'default' },
  pharmacy_admin:  { label: 'Pharmacy Admin',  variant: 'default' },
  pharmacy_staff:  { label: 'Pharmacy Staff',  variant: 'outline' },
  customer:        { label: 'Customer',        variant: 'secondary' },
};

export default function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUsers({
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter,
    page,
    limit: 20,
  });

  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const handleFilterChange = useCallback(() => setPage(1), []);

  const users: User[] = (data as { data?: User[] })?.data ?? (Array.isArray(data) ? data as User[] : []);
  const total: number = (data as { total?: number })?.total ?? 0;
  const totalPages: number = (data as { totalPages?: number })?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>+ Invite User</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); handleFilterChange(); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All roles</option>
          <option value="system_admin">System Admin</option>
          <option value="pharmacy_admin">Pharmacy Admin</option>
          <option value="pharmacy_staff">Pharmacy Staff</option>
          <option value="customer">Customer</option>
        </select>
        <select
          value={statusFilter === undefined ? '' : String(statusFilter)}
          onChange={(e) => {
            setStatusFilter(e.target.value === '' ? undefined : e.target.value === 'true');
            handleFilterChange();
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.length === 0
              ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                )
              : users.map((u) => {
                  const roleCfg = ROLE_BADGE[u.role] ?? { label: u.role, variant: 'secondary' as const };
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {u.tenant?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'default' : 'secondary'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditUser(u)}
                          >
                            Edit
                          </Button>
                          {u.isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deactivate.mutate(u.id)}
                              disabled={deactivate.isPending}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reactivate.mutate(u.id)}
                              disabled={reactivate.isPending}
                            >
                              Reactivate
                            </Button>
                          )}
                          <Link href={`/users/${u.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              ← Prev
            </Button>
            <span className="px-2 py-1">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditUserDrawer user={editUser} open={!!editUser} onClose={() => setEditUser(null)} />
    </div>
  );
}
