'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { Button, Badge } from '@medichainlk/ui';
import { useUsers, type User } from '@/hooks/useUsers';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { EditUserDrawer } from '@/components/users/EditUserDrawer';
import { useDeactivateUser, useReactivateUser } from '@/hooks/useUsers';
import Link from 'next/link';
import { Search, UserPlus, ChevronLeft, ChevronRight, Eye, Pencil, UserX, UserCheck, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TopProgressBar } from '@/components/shared/TopProgressBar';

const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  system_admin:    { label: 'System Admin',    variant: 'default' },
  pharmacy_admin:  { label: 'Pharmacy Admin',  variant: 'default' },
  pharmacy_staff:  { label: 'Pharmacy Staff',  variant: 'outline' },
  customer:        { label: 'Customer',        variant: 'secondary' },
};

const ROLE_COLORS: Record<string, string> = {
  system_admin:    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  pharmacy_admin:  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
  pharmacy_staff:  'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
  customer:        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

export default function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 400);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useUsers({
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
      <TopProgressBar loading={isFetching && !isLoading} />

      {/* Header */}
      <PageHeader
        title="Users"
        description={`${total > 0 ? `${total} total users` : 'Manage all platform users'}`}
        action={
          <Button
            onClick={() => setInviteOpen(true)}
            className="gap-2 glow-blue rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </Button>
        }
      />

      {/* Filters */}
      <div className="glass-filter-bar flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
            className="glass-input w-full pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); handleFilterChange(); }}
          className="glass-select"
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
          className="glass-select"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : users.length === 0 ? (
        <div className="glass-table">
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting your search or filter criteria"
          />
        </div>
      ) : (
        <div className="glass-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Email</th>
                <th className="text-left hidden md:table-cell">Phone</th>
                <th className="text-left">Role</th>
                <th className="text-left hidden lg:table-cell">Tenant</th>
                <th className="text-left">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleCfg = ROLE_BADGE[u.role] ?? { label: u.role, variant: 'secondary' as const };
                const roleColor = ROLE_COLORS[u.role] ?? ROLE_COLORS.customer;
                return (
                  <tr key={u.id}>
                    <td className="font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                          {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                        </div>
                        <span>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">{u.email ?? '—'}</td>
                    <td className="text-slate-500 dark:text-slate-400 hidden md:table-cell">{u.phone ?? '—'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${roleColor}`}>
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {u.tenant?.name ?? '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`status-dot ${u.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
                        <span className={`text-xs font-medium ${u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10"
                          onClick={() => setEditUser(u)}
                          title="Edit user"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {u.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-red-500/10 hover:text-destructive"
                            onClick={() => deactivate.mutate(u.id)}
                            disabled={deactivate.isPending}
                            title="Deactivate"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10"
                            onClick={() => reactivate.mutate(u.id)}
                            disabled={reactivate.isPending}
                            title="Reactivate"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Link href={`/users/${u.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10" title="View details">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-filter-bar flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-700 dark:text-slate-200">{(page - 1) * 20 + 1}–{Math.min(page * 20, total)}</span> of{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-lg text-xs ${page === pageNum ? 'glow-ring' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="px-1 text-slate-400">…</span>}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
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
