'use client';

import { useEffect, useState } from 'react';
import { Button } from '@medichainlk/ui';
import {
  useRolePermissions,
  useUpdateRolePermissions,
  type ScreenPermission,
} from '@/hooks/usePermissions';
import { Shield, Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { TopProgressBar } from '@/components/shared/TopProgressBar';

const ROLES = [
  { code: 'system_admin',   label: 'System Admin',   color: 'text-blue-600 dark:text-blue-400' },
  { code: 'pharmacy_staff', label: 'Pharmacy Staff',  color: 'text-teal-600 dark:text-teal-400' },
  { code: 'customer',       label: 'Customer',        color: 'text-slate-600 dark:text-slate-400' },
];

type PermMatrix = Record<string, Record<string, boolean>>;

function useRoleData(role: string) {
  return useRolePermissions(role);
}

export default function PermissionsPage() {
  const adminPerms  = useRoleData('system_admin');
  const staffPerms  = useRoleData('pharmacy_staff');
  const customerPerms = useRoleData('customer');

  const updatePerms = useUpdateRolePermissions();

  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const allLoaded =
    !adminPerms.isLoading && !staffPerms.isLoading && !customerPerms.isLoading;

  useEffect(() => {
    if (!allLoaded) return;
    const m: PermMatrix = {};
    const build = (perms: ScreenPermission[], role: string) => {
      for (const p of perms) {
        if (!m[p.id]) m[p.id] = { screenName: p.screenName as unknown as boolean };
        m[p.id][role] = p.isEnabled ?? false;
        (m[p.id] as Record<string, unknown>)['permissionCode'] = p.permissionCode;
        (m[p.id] as Record<string, unknown>)['screenName'] = p.screenName;
      }
    };
    build(adminPerms.data ?? [], 'system_admin');
    build(staffPerms.data ?? [], 'pharmacy_staff');
    build(customerPerms.data ?? [], 'customer');
    setMatrix(m);
    setDirty(false);
  }, [allLoaded, adminPerms.data, staffPerms.data, customerPerms.data]);

  const toggle = (permId: string, role: string) => {
    setMatrix((prev) => ({
      ...prev,
      [permId]: { ...prev[permId], [role]: !prev[permId]?.[role] },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        ROLES.map(({ code }) =>
          updatePerms.mutateAsync({
            role: code,
            updates: Object.entries(matrix).map(([permissionId, vals]) => ({
              permissionId,
              isEnabled: !!(vals as Record<string, boolean>)[code],
            })),
          }),
        ),
      );
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <TopProgressBar loading={saving} />

      <PageHeader
        title="Permissions"
        description="Control which screens each role can access"
        badge={
          dirty ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="status-dot status-dot-warning" />
              Unsaved changes
            </span>
          ) : undefined
        }
        action={
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`gap-2 rounded-xl ${dirty ? 'glow-blue' : ''}`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
          </Button>
        }
      />

      {!allLoaded ? (
        <TableSkeleton rows={10} cols={4} />
      ) : (
        <div className="glass-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left w-1/2">Screen</th>
                {ROLES.map((r) => (
                  <th key={r.code} className="text-center">
                    <span className={r.color}>{r.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(matrix).map(([permId, vals]) => (
                <tr key={permId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500/10 to-violet-500/10 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-blue-500/70" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {(vals as Record<string, unknown>)['screenName'] as string}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {(vals as Record<string, unknown>)['permissionCode'] as string}
                        </div>
                      </div>
                    </div>
                  </td>
                  {ROLES.map(({ code }) => (
                    <td key={code} className="text-center">
                      <label className="glass-checkbox inline-block">
                        <input
                          type="checkbox"
                          checked={!!(vals as Record<string, boolean>)[code]}
                          onChange={() => toggle(permId, code)}
                          aria-label={`${(vals as Record<string, unknown>)['screenName'] as string} for ${code}`}
                        />
                        <span className="checkmark" />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dirty && (
        <div className="glass-filter-bar flex items-center gap-3 border-amber-500/30 bg-amber-500/5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
          </p>
        </div>
      )}
    </div>
  );
}
