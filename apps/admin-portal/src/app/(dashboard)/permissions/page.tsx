'use client';

import { useEffect, useState } from 'react';
import { Button, Skeleton } from '@medichainlk/ui';
import {
  useRolePermissions,
  useUpdateRolePermissions,
  type ScreenPermission,
} from '@/hooks/usePermissions';

const ROLES = [
  { code: 'system_admin',   label: 'System Admin' },
  { code: 'pharmacy_staff', label: 'Pharmacy Staff' },
  { code: 'customer',       label: 'Customer' },
];

type PermMatrix = Record<string, Record<string, boolean>>; // screenName → role → enabled

function useRoleData(role: string) {
  return useRolePermissions(role);
}

export default function PermissionsPage() {
  const adminPerms  = useRoleData('system_admin');
  const staffPerms  = useRoleData('pharmacy_staff');
  const customerPerms = useRoleData('customer');

  const updatePerms = useUpdateRolePermissions();

  // Local editable matrix: permissionId → role → isEnabled
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const allLoaded =
    !adminPerms.isLoading && !staffPerms.isLoading && !customerPerms.isLoading;

  // Build initial matrix once data loads
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
          <p className="text-muted-foreground">Control which screens each role can access</p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
        </Button>
      </div>

      {!allLoaded ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-1/2">Screen</th>
                {ROLES.map((r) => (
                  <th key={r.code} className="text-center px-4 py-3 font-medium text-muted-foreground">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(matrix).map(([permId, vals]) => (
                <tr key={permId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{(vals as Record<string, unknown>)['screenName'] as string}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {(vals as Record<string, unknown>)['permissionCode'] as string}
                    </div>
                  </td>
                  {ROLES.map(({ code }) => (
                    <td key={code} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!(vals as Record<string, boolean>)[code]}
                        onChange={() => toggle(permId, code)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                        aria-label={`${(vals as Record<string, unknown>)['screenName'] as string} for ${code}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dirty && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
        </p>
      )}
    </div>
  );
}
