'use client';

import {
  useReplaceUserOverrides,
  useUserEffectivePermissions,
  type EffectivePermissionRow,
  type OverrideInput,
  type PermissionSource,
} from '@/hooks/useUserPermissions';
import { Button } from '@medichainlk/ui';
import { Check, CircleSlash, Loader2, RotateCcw, Save, Shield, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Decision = 'inherit' | 'grant' | 'revoke';

interface Props {
  userId: string;
}

function rowToDecision(row: EffectivePermissionRow): Decision {
  if (row.override === 'grant') return 'grant';
  if (row.override === 'revoke') return 'revoke';
  return 'inherit';
}

function sourceLabel(source: PermissionSource): string {
  switch (source) {
    case 'role':    return 'Granted by role';
    case 'default': return 'Not granted by role';
    case 'grant':   return 'Force-granted (override)';
    case 'revoke':  return 'Force-revoked (override)';
  }
}

export function UserPermissionsPanel({ userId }: Props) {
  const { data, isLoading, error, refetch } = useUserEffectivePermissions(userId);
  const replace = useReplaceUserOverrides(userId);

  // local working state: permissionId → decision
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [serverError, setServerError] = useState('');

  // Sync local state from server response
  useEffect(() => {
    if (!data) return;
    const next: Record<string, Decision> = {};
    for (const r of data.permissions) {
      next[r.permissionId] = rowToDecision(r);
    }
    setDecisions(next);
  }, [data]);

  // Group rows by category
  const grouped = useMemo(() => {
    if (!data) return [];
    const m = new Map<string, EffectivePermissionRow[]>();
    for (const r of data.permissions) {
      const cat = r.category ?? 'Other';
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(r);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  // Diff calculator — which permissionIds have a decision different from the server state
  const diff = useMemo(() => {
    if (!data) return { added: 0, changed: 0, removed: 0, total: 0 };
    let added = 0;
    let changed = 0;
    let removed = 0;
    for (const r of data.permissions) {
      const orig = rowToDecision(r);
      const cur = decisions[r.permissionId] ?? 'inherit';
      if (orig === cur) continue;
      if (orig === 'inherit') added++;
      else if (cur === 'inherit') removed++;
      else changed++;
    }
    return { added, changed, removed, total: added + changed + removed };
  }, [data, decisions]);

  const handleSave = async () => {
    setServerError('');
    // Build the override list — only entries that are NOT 'inherit'
    const overrides: OverrideInput[] = Object.entries(decisions)
      .filter(([, d]) => d !== 'inherit')
      .map(([permissionId, d]) => ({ permissionId, isGranted: d === 'grant' }));

    try {
      await replace.mutateAsync(overrides);
    } catch (err: unknown) {
      type ApiError = { response?: { data?: { error?: string; message?: string } } };
      const body = (err as ApiError)?.response?.data;
      setServerError(body?.error ?? body?.message ?? 'Failed to save permissions');
    }
  };

  const handleReset = () => {
    if (!data) return;
    const next: Record<string, Decision> = {};
    for (const r of data.permissions) {
      next[r.permissionId] = rowToDecision(r);
    }
    setDecisions(next);
    setServerError('');
  };

  if (isLoading) {
    return (
      <div className="section-glass flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading permissions…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
        {error instanceof Error ? error.message : 'Failed to load permissions'}
        <button onClick={() => refetch()} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  const grantedCount = Object.values(decisions).filter((d) => d === 'grant').length;
  const revokedCount = Object.values(decisions).filter((d) => d === 'revoke').length;
  const effectiveCount = data.permissions.filter((r) => {
    const d = decisions[r.permissionId] ?? rowToDecision(r);
    if (d === 'grant') return true;
    if (d === 'revoke') return false;
    return r.fromRole;
  }).length;

  return (
    <div className="space-y-6">
      {/* Role banner */}
      <div className="section-glass space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-400">User Role</div>
            <div className="text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              {data.role?.name ?? data.user.role}
              {data.role?.isSystem && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-semibold">
                  System
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Overrides on this page apply <strong>on top of</strong> the role&apos;s permissions.
              Pick <em>Inherit</em> to fall back to the role default; <em>Grant</em> or <em>Revoke</em> to force a state.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 dark:border-white/5">
          <Stat label="Effective" value={effectiveCount} total={data.permissions.length} />
          <Stat label="From role" value={data.permissions.filter((r) => r.fromRole).length} total={data.permissions.length} />
          <Stat label="Granted (override)" value={grantedCount} accent="text-emerald-400" />
          <Stat label="Revoked (override)" value={revokedCount} accent="text-red-400" />
        </div>
      </div>

      {/* Permissions grouped by category */}
      {grouped.map(([category, rows]) => (
        <div key={category} className="section-glass space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 pb-2 border-b border-white/10 dark:border-white/5">
            {category}
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <PermissionRow
                key={row.permissionId}
                row={row}
                decision={decisions[row.permissionId] ?? 'inherit'}
                onChange={(d) => setDecisions((prev) => ({ ...prev, [row.permissionId]: d }))}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Diff summary + actions (sticky-ish at bottom of panel) */}
      {serverError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <div className="text-xs text-slate-400">
          {diff.total === 0 ? (
            <span>No pending changes</span>
          ) : (
            <span>
              <strong className="text-slate-700 dark:text-slate-200">{diff.total}</strong> pending change{diff.total === 1 ? '' : 's'} ·
              {diff.added > 0 && <> <span className="text-emerald-400">+{diff.added} new</span></>}
              {diff.changed > 0 && <> <span className="text-amber-400">{diff.changed} flipped</span></>}
              {diff.removed > 0 && <> <span className="text-slate-400">{diff.removed} cleared</span></>}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={diff.total === 0 || replace.isPending}
          className="rounded-xl gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={diff.total === 0 || replace.isPending}
          className="rounded-xl gap-1 glow-blue"
        >
          {replace.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save changes</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Stat({ label, value, total, accent }: { label: string; value: number; total?: number; accent?: string }) {
  return (
    <div className="rounded-lg bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${accent ?? 'text-slate-700 dark:text-slate-200'}`}>
        {value}
        {total !== undefined && (
          <span className="text-xs text-slate-400 font-medium"> / {total}</span>
        )}
      </div>
    </div>
  );
}

function PermissionRow({
  row,
  decision,
  onChange,
}: {
  row: EffectivePermissionRow;
  decision: Decision;
  onChange: (d: Decision) => void;
}) {
  const isModified = decision !== rowToDecision(row);
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
        isModified
          ? 'border-amber-500/30 bg-amber-500/[0.04]'
          : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
          {row.screenName}
          {isModified && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-semibold">
              Modified
            </span>
          )}
        </div>
        {row.description && <div className="text-xs text-slate-400 truncate">{row.description}</div>}
        <div className="flex items-center gap-2 mt-1">
          <code className="text-[10px] text-slate-500 font-mono">{row.permissionCode}</code>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10px] text-slate-400">{sourceLabel(row.source)}</span>
        </div>
      </div>

      <PillGroup decision={decision} onChange={onChange} fromRole={row.fromRole} />
    </div>
  );
}

function PillGroup({
  decision,
  onChange,
  fromRole,
}: {
  decision: Decision;
  onChange: (d: Decision) => void;
  fromRole: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.03] overflow-hidden shrink-0">
      <PillButton
        active={decision === 'inherit'}
        onClick={() => onChange('inherit')}
        title={fromRole ? 'Inherit from role (granted)' : 'Inherit from role (not granted)'}
        activeClass="bg-slate-500/15 text-slate-700 dark:text-slate-200"
      >
        <CircleSlash className="w-3.5 h-3.5" />
        Inherit
      </PillButton>
      <PillButton
        active={decision === 'grant'}
        onClick={() => onChange('grant')}
        title="Force-grant this permission regardless of role"
        activeClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      >
        <Check className="w-3.5 h-3.5" />
        Grant
      </PillButton>
      <PillButton
        active={decision === 'revoke'}
        onClick={() => onChange('revoke')}
        title="Force-revoke this permission regardless of role"
        activeClass="bg-red-500/15 text-red-500 dark:text-red-400"
      >
        <XCircle className="w-3.5 h-3.5" />
        Revoke
      </PillButton>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  title,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active ? activeClass : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}
