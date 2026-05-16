'use client';

import { usePermissions } from '@/hooks/useRoles';
import type { CreateMenuItemPayload, MenuItemType, UpdateMenuItemPayload } from '@/hooks/useMenu';
import { Button, Label } from '@medichainlk/ui';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';

// A small curated icon set the admin can pick for parent/child rows.
// Must match keys in Sidebar's ICON_MAP.
const ICON_CHOICES = [
  'LayoutDashboard', 'Building2', 'Users', 'Shield', 'ShieldCheck',
  'Package', 'Pill', 'ClipboardList', 'ShoppingCart', 'CreditCard',
  'BarChart3', 'Activity',
];

type PermMode = 'existing' | 'new';

export interface MenuFormSubmit {
  label: string;
  icon?: string;
  route?: string;
  permissionId?: string;
  newPermission?: {
    permissionCode: string;
    screenName: string;
    description?: string;
    category?: string;
  };
}

interface Props {
  /** Fixed for add (the type being created); for edit it's the existing item's type. */
  type: MenuItemType;
  /** Edit mode — prefill values. Absent ⇒ create mode. */
  initial?: {
    label: string;
    icon?: string | null;
    route?: string | null;
    permissionId?: string | null;
  };
  isEdit?: boolean;
  submitting: boolean;
  serverError?: string;
  onSubmit: (values: MenuFormSubmit) => void | Promise<void>;
  onCancel: () => void;
}

export function MenuItemForm({
  type,
  initial,
  isEdit,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: Props) {
  const { data: permissions = [], isLoading: permsLoading } = usePermissions();

  const [label, setLabel] = useState(initial?.label ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [route, setRoute] = useState(initial?.route ?? '');
  const [permissionId, setPermissionId] = useState(initial?.permissionId ?? '');

  // Screen permission mode — edit always uses 'existing' (can't recreate a permission)
  const [permMode, setPermMode] = useState<PermMode>('existing');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [touched, setTouched] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of permissions) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [permissions]);

  const isScreen = type === 'screen';

  // ─── Validation ───────────────────────────────────────────────────────────
  const labelError = touched && label.trim().length < 2 ? 'Label must be at least 2 characters' : '';
  const routeError =
    isScreen && touched && !route.trim()
      ? 'Route is required for a screen'
      : isScreen && route.trim() && !route.startsWith('/')
        ? 'Route must start with /'
        : '';
  const existingPermError =
    isScreen && permMode === 'existing' && touched && !permissionId
      ? 'Pick a permission'
      : '';
  const newCodeError =
    isScreen && permMode === 'new' && touched && !/^[A-Z][A-Z0-9_]*$/.test(newCode.trim())
      ? 'Code must be UPPER_SNAKE_CASE (e.g. GRN_VIEW)'
      : '';
  const newNameError =
    isScreen && permMode === 'new' && touched && newName.trim().length < 2
      ? 'Permission display name required'
      : '';

  const hasErrors =
    !!labelError || !!routeError || !!existingPermError || !!newCodeError || !!newNameError;

  // Auto-suggest a permission code from the label when typing a new permission
  const suggestCode = () => {
    if (!label.trim()) return;
    const code = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    setNewCode(code);
    if (!newName) setNewName(label.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (label.trim().length < 2) return;

    if (!isScreen) {
      onSubmit({ label: label.trim(), icon: icon || undefined });
      return;
    }

    // screen
    if (!route.trim() || !route.startsWith('/')) return;

    if (permMode === 'existing') {
      if (!permissionId) return;
      onSubmit({ label: label.trim(), route: route.trim(), permissionId });
    } else {
      if (!/^[A-Z][A-Z0-9_]*$/.test(newCode.trim()) || newName.trim().length < 2) return;
      onSubmit({
        label: label.trim(),
        route: route.trim(),
        newPermission: {
          permissionCode: newCode.trim(),
          screenName: newName.trim(),
          description: newDesc.trim() || undefined,
          category: newCategory.trim() || undefined,
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {type === 'parent' ? 'Parent Menu Label' : type === 'child' ? 'Child Menu Label' : 'Screen Label'}{' '}
          <span className="text-red-400">*</span>
        </Label>
        <input
          className="glass-input w-full"
          placeholder={type === 'screen' ? 'e.g. Goods Receive Note' : 'e.g. Inventory'}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        {labelError && <p className="text-xs text-red-400">{labelError}</p>}
      </div>

      {/* Icon — parent/child only */}
      {!isScreen && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Icon
          </Label>
          <select className="glass-input w-full" value={icon} onChange={(e) => setIcon(e.target.value)}>
            <option value="">No icon</option>
            {ICON_CHOICES.map((ic) => (
              <option key={ic} value={ic}>{ic}</option>
            ))}
          </select>
        </div>
      )}

      {/* Screen-only fields */}
      {isScreen && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Route <span className="text-red-400">*</span>
            </Label>
            <input
              className="glass-input w-full font-mono text-sm"
              placeholder="/inventory/grn"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
            />
            {routeError && <p className="text-xs text-red-400">{routeError}</p>}
          </div>

          {/* Permission — only editable on create; on edit just show the linked one */}
          {isEdit ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Linked Permission
              </Label>
              <select
                className="glass-input w-full"
                value={permissionId}
                onChange={(e) => setPermissionId(e.target.value)}
              >
                <option value="">— none —</option>
                {permissions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.screenName} ({p.permissionCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Permission <span className="text-red-400">*</span>
              </Label>

              {/* Mode toggle */}
              <div className="inline-flex rounded-lg border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.03] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPermMode('existing')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    permMode === 'existing'
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Use existing
                </button>
                <button
                  type="button"
                  onClick={() => { setPermMode('new'); suggestCode(); }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                    permMode === 'new'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" /> Create new
                </button>
              </div>

              {permMode === 'existing' ? (
                <div className="space-y-1.5">
                  {permsLoading ? (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading permissions…
                    </div>
                  ) : (
                    <select
                      className="glass-input w-full"
                      value={permissionId}
                      onChange={(e) => setPermissionId(e.target.value)}
                    >
                      <option value="">Select a permission…</option>
                      {permissions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.screenName} ({p.permissionCode})
                        </option>
                      ))}
                    </select>
                  )}
                  {existingPermError && <p className="text-xs text-red-400">{existingPermError}</p>}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 space-y-3">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    A new ScreenPermission is created and linked to this screen in one transaction.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide text-slate-400">Permission Code</Label>
                      <input
                        className="glass-input w-full font-mono text-sm"
                        placeholder="GRN_VIEW"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      />
                      {newCodeError && <p className="text-xs text-red-400">{newCodeError}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide text-slate-400">Display Name</Label>
                      <input
                        className="glass-input w-full"
                        placeholder="View Goods Receive Notes"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      {newNameError && <p className="text-xs text-red-400">{newNameError}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide text-slate-400">Category</Label>
                      <input
                        className="glass-input w-full"
                        placeholder="Inventory"
                        list="perm-categories"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                      <datalist id="perm-categories">
                        {categories.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide text-slate-400">Description</Label>
                      <input
                        className="glass-input w-full"
                        placeholder="Short description"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {serverError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400 flex items-start gap-2">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1" />
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl" disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || (touched && hasErrors)} className="rounded-xl glow-blue">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Saving…</> : isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
