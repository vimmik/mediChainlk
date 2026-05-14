'use client';

import {
  Role,
  RoleScope,
  ScreenPermission,
  usePermissions,
} from '@/hooks/useRoles';
import { useTenants } from '@/hooks/useTenants';
import { useAuthStore } from '@/store/authStore';
import { Button, Label } from '@medichainlk/ui';
import { Check, Loader2, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export interface RoleFormValues {
  name: string;
  description: string;
  scope: RoleScope;
  tenantId: string | null;
  permissionIds: string[];
  isActive: boolean;
}

interface Props {
  initial?: Role;
  /** Disable fields that cannot be changed on edit (e.g. scope for existing roles). */
  isEdit?: boolean;
  submitting: boolean;
  serverError?: string;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  onCancel: () => void;
}

const SCOPE_OPTIONS: Array<{ value: RoleScope; label: string; description: string }> = [
  { value: 'tenant', label: 'Tenant', description: 'For pharmacy_admin users — covers all branches in the tenant' },
  { value: 'branch', label: 'Branch', description: 'For pharmacy_staff users — branch-level access' },
  { value: 'system', label: 'System', description: 'Platform-wide. system_admin only.' },
  { value: 'customer', label: 'Customer', description: 'Customer mobile-app users' },
];

export function RoleForm({ initial, isEdit, submitting, serverError, onSubmit, onCancel }: Props) {
  const callerRole = useAuthStore((s) => s.role);
  const callerTenantId = useAuthStore((s) => s.tenantId);
  const { data: permissions = [], isLoading: permsLoading } = usePermissions();

  const { data: tenantsData } = useTenants({ page: 1, limit: 100 });
  const tenants = useMemo(
    () => (tenantsData?.data ?? []).filter((t) => t.isActive),
    [tenantsData],
  );

  const [values, setValues] = useState<RoleFormValues>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    scope: initial?.scope ?? (callerRole === 'pharmacy_admin' ? 'branch' : 'tenant'),
    tenantId: initial?.tenantId ?? (callerRole === 'pharmacy_admin' ? callerTenantId : null),
    permissionIds: initial?.permissions.map((p) => p.permissionId) ?? [],
    isActive: initial?.isActive ?? true,
  });
  const [touched, setTouched] = useState<{ name?: boolean }>({});

  // Scope choices for pharmacy_admin are limited to tenant + branch
  const scopeOptions = useMemo(() => {
    if (callerRole === 'pharmacy_admin') {
      return SCOPE_OPTIONS.filter((o) => o.value === 'tenant' || o.value === 'branch');
    }
    return SCOPE_OPTIONS;
  }, [callerRole]);

  // Group permissions by category for the picker
  const grouped = useMemo(() => {
    const map = new Map<string, ScreenPermission[]>();
    for (const p of permissions) {
      const cat = p.category ?? 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  // Auto-set tenantId if scope is tenant/branch and pharmacy_admin
  useEffect(() => {
    if (callerRole === 'pharmacy_admin' && callerTenantId) {
      setValues((v) => ({ ...v, tenantId: callerTenantId }));
    }
  }, [callerRole, callerTenantId, values.scope]);

  const togglePermission = (id: string) => {
    setValues((v) => ({
      ...v,
      permissionIds: v.permissionIds.includes(id)
        ? v.permissionIds.filter((x) => x !== id)
        : [...v.permissionIds, id],
    }));
  };

  const toggleAllInCategory = (perms: ScreenPermission[], allSelected: boolean) => {
    setValues((v) => {
      const ids = perms.map((p) => p.id);
      if (allSelected) {
        return { ...v, permissionIds: v.permissionIds.filter((id) => !ids.includes(id)) };
      }
      return { ...v, permissionIds: Array.from(new Set([...v.permissionIds, ...ids])) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true });
    if (values.name.trim().length < 2) return;
    if (values.permissionIds.length === 0) return;
    await onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
    });
  };

  const nameError = touched.name && values.name.trim().length < 2 ? 'Name must be at least 2 characters' : undefined;
  const permError = touched.name && values.permissionIds.length === 0 ? 'Select at least one permission' : undefined;
  const needsTenant = (values.scope === 'tenant' || values.scope === 'branch') && callerRole === 'system_admin';

  const isSystemReadonly = isEdit && initial?.isSystem === true && callerRole !== 'system_admin';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSystemReadonly && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-400 flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          This is a system role — its permissions can only be edited by system_admin.
        </div>
      )}

      <div className="section-glass space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Name <span className="text-red-400">*</span>
            </Label>
            <input
              className="glass-input w-full"
              placeholder="e.g. Cashier"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              disabled={initial?.isSystem}
            />
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
            {initial?.isSystem && <p className="text-xs text-slate-400">System role names cannot be changed.</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Status
            </Label>
            <select
              className="glass-input w-full"
              value={values.isActive ? 'active' : 'inactive'}
              onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.value === 'active' }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Description
            </Label>
            <textarea
              className="glass-input w-full resize-none"
              rows={2}
              placeholder="What does this role grant?"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Scope <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {scopeOptions.map((opt) => {
                  const selected = values.scope === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValues((v) => ({ ...v, scope: opt.value }))}
                      className={`text-left rounded-xl p-3 border transition-all ${
                        selected
                          ? 'border-violet-500/60 bg-violet-500/10 ring-2 ring-violet-500/30'
                          : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] hover:border-violet-500/30'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{opt.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{opt.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {needsTenant && !isEdit && (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Tenant <span className="text-red-400">*</span>
              </Label>
              <select
                className="glass-input w-full"
                value={values.tenantId ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, tenantId: e.target.value || null }))}
                required
              >
                <option value="">Select a pharmacy…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="section-glass space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/5">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Permissions</div>
            <div className="text-xs text-slate-400">Pick which screens this role can access</div>
          </div>
          <div className="text-xs text-slate-400">
            {values.permissionIds.length} of {permissions.length} selected
          </div>
        </div>

        {permsLoading ? (
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading permissions…
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([category, perms]) => {
              const allSelected = perms.every((p) => values.permissionIds.includes(p.id));
              const someSelected = !allSelected && perms.some((p) => values.permissionIds.includes(p.id));
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      {category}
                      {someSelected && <span className="text-violet-400 normal-case">·  partial</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAllInCategory(perms, allSelected)}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      {allSelected ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map((p) => {
                      const checked = values.permissionIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            checked
                              ? 'border-violet-500/40 bg-violet-500/5'
                              : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] hover:border-violet-500/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="glass-checkbox mt-0.5 shrink-0"
                            checked={checked}
                            onChange={() => togglePermission(p.id)}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.screenName}</div>
                            {p.description && (
                              <div className="text-xs text-slate-400 truncate">{p.description}</div>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.permissionCode}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {permError && <p className="text-xs text-red-400">{permError}</p>}
      </div>

      {serverError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1" />
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="rounded-xl gap-1 glow-blue">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : (
            <><Check className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Role'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
