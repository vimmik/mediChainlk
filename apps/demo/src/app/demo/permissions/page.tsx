'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
    SCREEN_PERMISSIONS, USER_TYPE_PERMISSION_MAP,
    USER_TYPES,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useDemoStore, useHasHydrated } from '@/store/demo-store';
import { Check, Lock, Shield, Users, X } from 'lucide-react';

export default function PermissionsPage() {
  const { togglePermission, isPermissionEnabled } = useDemoStore();
  const hasHydrated = useHasHydrated();

  // Build effective permission check: base from USER_TYPE_PERMISSION_MAP + overrides
  const hasBasePermission = (userTypeId: string, permissionId: string) =>
    USER_TYPE_PERMISSION_MAP.some((m) => m.userTypeId === userTypeId && m.permissionId === permissionId);

  const isEnabled = (userTypeId: string, permissionId: string) => {
    if (!hasHydrated) return hasBasePermission(userTypeId, permissionId);
    const overridden = isPermissionEnabled(`${userTypeId}:${permissionId}`);
    if (overridden !== undefined) return overridden;
    return hasBasePermission(userTypeId, permissionId);
  };

  const totalPermissions = SCREEN_PERMISSIONS.length;
  const totalMappings = USER_TYPE_PERMISSION_MAP.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Management"
        sub="Role-based access control matrix — UserType × Screen Permissions"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="User Types" value={USER_TYPES.length} icon={Users} color="blue" sub="Role definitions" />
        <StatCard title="Permissions" value={totalPermissions} icon={Shield} color="purple" sub="Screen-level controls" />
        <StatCard title="Active Mappings" value={totalMappings} icon={Check} color="green" sub="Assigned permissions" />
        <StatCard title="Coverage" value={`${Math.round((totalMappings / (USER_TYPES.length * totalPermissions)) * 100)}%`} icon={Lock} color="amber" sub="Permission matrix fill" />
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Permission Matrix</p>
          <p className="text-xs text-slate-500 mt-0.5">Click toggles to override permissions in this demo session</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px] sticky left-0 bg-white z-10">Screen Permission</th>
                {USER_TYPES.map((ut) => (
                  <th key={ut.id} className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">
                    <div>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-1',
                        ut.code === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        ut.code === 'PHARMACIST' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700',
                      )}>
                        {ut.code}
                      </span>
                      <br />
                      {ut.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SCREEN_PERMISSIONS.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 sticky left-0 bg-white z-10">
                    <div>
                      <span className="font-medium text-slate-800">{perm.screenName}</span>
                      <span className="block text-[10px] font-mono text-slate-400">{perm.code}</span>
                    </div>
                  </td>
                  {USER_TYPES.map((ut) => {
                    const enabled = isEnabled(ut.id, perm.id);
                    return (
                      <td key={ut.id} className="text-center px-5 py-3">
                        <button
                          onClick={() => togglePermission(`${ut.id}:${perm.id}`)}
                          className={cn(
                            'w-10 h-6 rounded-full relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1',
                            enabled
                              ? 'bg-green-500 focus:ring-green-400'
                              : 'bg-slate-300 focus:ring-slate-400',
                          )}
                        >
                          <span className={cn(
                            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 flex items-center justify-center',
                            enabled ? 'translate-x-4' : 'translate-x-0.5',
                          )}>
                            {enabled ? <Check className="w-3 h-3 text-green-600" /> : <X className="w-3 h-3 text-slate-400" />}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          {USER_TYPES.length} roles × {SCREEN_PERMISSIONS.length} permissions = {USER_TYPES.length * SCREEN_PERMISSIONS.length} cells • Demo overrides persist in localStorage
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-6 h-4 rounded-full bg-green-500 inline-block" /> Enabled
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-4 rounded-full bg-slate-300 inline-block" /> Disabled
        </div>
        <span className="text-slate-400">• Click any toggle to override the default role-based permission</span>
      </div>
    </div>
  );
}
