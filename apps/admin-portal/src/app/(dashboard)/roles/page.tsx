'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { TopProgressBar } from '@/components/shared/TopProgressBar';
import { useDeleteRole, useRoles, type Role, type RoleScope } from '@/hooks/useRoles';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@medichainlk/ui';
import { Building2, Lock, Pencil, Plus, Search, Shield, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

const SCOPE_BADGE: Record<RoleScope, { label: string; cls: string }> = {
  system:   { label: 'System',   cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
  tenant:   { label: 'Tenant',   cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20' },
  branch:   { label: 'Branch',   cls: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20' },
  customer: { label: 'Customer', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' },
};

export default function RolesPage() {
  const callerRole = useAuthStore((s) => s.role);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [scopeFilter, setScopeFilter] = useState<RoleScope | ''>('');

  const { data: roles = [], isLoading, isFetching } = useRoles({
    search: debouncedSearch || undefined,
    scope: scopeFilter || undefined,
  });

  const deleteRole = useDeleteRole();

  const filtered = useMemo(() => roles, [roles]);
  const systemRolesCount = filtered.filter((r) => r.isSystem).length;
  const customRolesCount = filtered.length - systemRolesCount;

  const handleDelete = async (r: Role) => {
    if (r._count && r._count.users > 0) {
      alert(`Cannot delete "${r.name}" — ${r._count.users} user(s) still assigned.`);
      return;
    }
    if (!confirm(`Delete role "${r.name}"? This cannot be undone.`)) return;
    try {
      await deleteRole.mutateAsync(r.id);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to delete role';
      alert(msg);
    }
  };

  const canCreate = callerRole === 'system_admin' || callerRole === 'pharmacy_admin';

  return (
    <div className="space-y-6">
      <TopProgressBar loading={isFetching && !isLoading} />

      <PageHeader
        title="Roles"
        description={`${filtered.length} total — ${systemRolesCount} system, ${customRolesCount} custom`}
        action={
          canCreate ? (
            <Link href="/roles/new">
              <Button className="gap-2 glow-blue rounded-xl">
                <Plus className="w-4 h-4" />
                New Role
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Filters */}
      <div className="glass-filter-bar flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-9"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as RoleScope | '')}
          className="glass-select"
        >
          <option value="">All scopes</option>
          <option value="system">System</option>
          <option value="tenant">Tenant</option>
          <option value="branch">Branch</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="glass-table">
          <EmptyState
            icon={Shield}
            title="No roles found"
            description={debouncedSearch || scopeFilter
              ? 'Try adjusting your search or filter'
              : 'Create your first custom role to get started'}
            action={
              canCreate && !debouncedSearch && !scopeFilter ? (
                <Link href="/roles/new">
                  <Button className="gap-2 rounded-xl glow-blue">
                    <Plus className="w-4 h-4" /> Create Role
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="glass-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Role</th>
                <th className="text-left">Scope</th>
                <th className="text-left">Tenant</th>
                <th className="text-left">Permissions</th>
                <th className="text-left">Users</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                        {r.isSystem ? <Lock className="w-4 h-4 text-blue-500" /> : <Shield className="w-4 h-4 text-violet-500" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {r.name}
                          {r.isSystem && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-semibold">
                              System
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <div className="text-xs text-slate-400 truncate max-w-md">{r.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${SCOPE_BADGE[r.scope].cls}`}>
                      {SCOPE_BADGE[r.scope].label}
                    </span>
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 text-xs">
                    {r.tenant ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {r.tenant.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="text-slate-500 dark:text-slate-400 text-xs">
                    {r.permissions.length} permission{r.permissions.length !== 1 ? 's' : ''}
                  </td>
                  <td className="text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {r._count?.users ?? 0}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${r.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
                      <span className={`text-xs font-medium ${r.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/roles/${r.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-violet-500/10 hover:text-violet-500" title="View / edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      {!r.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-red-500/10"
                          onClick={() => handleDelete(r)}
                          disabled={deleteRole.isPending || (r._count?.users ?? 0) > 0}
                          title={(r._count?.users ?? 0) > 0 ? 'Cannot delete — users still assigned' : 'Delete role'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
