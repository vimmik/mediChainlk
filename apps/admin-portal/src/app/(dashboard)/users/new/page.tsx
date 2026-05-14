'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { useProvisionUser, type ProvisionUserPayload } from '@/hooks/useUsers';
import { useBranches, useTenants } from '@/hooks/useTenants';
import { useRoles, type RoleScope } from '@/hooks/useRoles';
import { useAuthStore } from '@/store/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Label } from '@medichainlk/ui';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  Shield,
  Star,
  User as UserIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// ─── Draft persistence ───────────────────────────────────────────────────────

const DRAFT_KEY = 'medi-new-user-draft';

interface DraftShape extends Partial<FormValues> {
  branchIds?: string[];
  primaryBranchId?: string;
}

function saveDraft(values: DraftShape) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(values)); } catch { /* ignore */ }
}

function loadDraft(): DraftShape | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftShape) : null;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// ─── Constants ───────────────────────────────────────────────────────────────

type Role = 'system_admin' | 'pharmacy_admin' | 'pharmacy_staff' | 'customer';

const ROLES: Array<{ value: Role; label: string; description: string; icon: typeof UserIcon }> = [
  {
    value: 'system_admin',
    label: 'System Admin',
    description: 'Full platform access across all tenants. No tenant or branch scope.',
    icon: Shield,
  },
  {
    value: 'pharmacy_admin',
    label: 'Pharmacy Admin',
    description: 'Manages every branch of a single pharmacy tenant.',
    icon: Building2,
  },
  {
    value: 'pharmacy_staff',
    label: 'Pharmacy Staff',
    description: 'Works at one or more specific branches. Branch-level data access only.',
    icon: MapPin,
  },
  {
    value: 'customer',
    label: 'Customer',
    description: 'Mobile app end-user. No tenant. No staff features.',
    icon: UserIcon,
  },
];

const STEPS = ['Role', 'Account', 'Pharmacy', 'Review'] as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z
  .object({
    role: z.enum(['system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer'], {
      message: 'Select a role',
    }),
    firstName: z.string().max(128).optional(),
    lastName: z.string().max(128).optional(),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .regex(/^\+?[0-9\s\-().]{7,32}$/, 'Enter a valid phone number')
      .or(z.literal(''))
      .optional(),
    password: z.string().min(8, 'At least 8 characters').max(128),
    confirmPassword: z.string().min(8),
    tenantId: z.string().optional(),
    roleId: z.string().optional(),
    sendPasswordReset: z.boolean().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  role: 'pharmacy_staff',
  email: '',
  password: '',
  confirmPassword: '',
  sendPasswordReset: false,
};

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, visibleSteps }: { current: number; visibleSteps: readonly string[] }) {
  return (
    <nav className="flex items-center gap-3 mb-8 flex-wrap">
      {visibleSteps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done
                  ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30'
                  : active
                    ? 'bg-violet-500/20 text-violet-400 ring-2 ring-violet-500/40'
                    : 'bg-white/5 text-slate-500 ring-1 ring-white/10'
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-violet-400' : done ? 'text-emerald-400' : 'text-slate-500'}`}>
              {label}
            </span>
            {i < visibleSteps.length - 1 && <div className="w-8 h-px bg-white/10" />}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewUserPage() {
  const router = useRouter();
  const provisionUser = useProvisionUser();
  const callerRole = useAuthStore((s) => s.role);
  const callerTenantId = useAuthStore((s) => s.tenantId);

  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Branch state lives outside react-hook-form because it's a set, not flat fields
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [primaryBranchId, setPrimaryBranchId] = useState<string | undefined>();
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;
  const role = watch('role');
  const tenantId = watch('tenantId');

  // pharmacy_admin caller is locked to their own tenant
  const lockedTenantId = callerRole === 'pharmacy_admin' ? callerTenantId : null;

  // Pull tenants — for pharmacy_admin we only need theirs, but the existing list
  // endpoint already enforces tenant scope server-side.
  const { data: tenantsData } = useTenants({ page: 1, limit: 100 });
  const tenants = useMemo(() => {
    const list = (tenantsData?.data ?? []) as Array<{ id: string; name: string; isActive: boolean }>;
    return list.filter((t) => t.isActive);
  }, [tenantsData]);

  // Effective tenantId: forced for pharmacy_admin, otherwise from the form
  const effectiveTenantId = lockedTenantId ?? tenantId ?? '';

  const { data: branches = [] } = useBranches(effectiveTenantId);
  const activeBranches = useMemo(
    () => (branches as Array<{ id: string; name: string; city?: string; isActive: boolean }>).filter((b) => b.isActive),
    [branches],
  );

  // ─── Role bundle picker ───────────────────────────────────────────────────
  // Each user role-string maps to a Role.scope value.
  const expectedScope: RoleScope | undefined = useMemo(() => {
    if (role === 'system_admin') return 'system';
    if (role === 'pharmacy_admin') return 'tenant';
    if (role === 'pharmacy_staff') return 'branch';
    if (role === 'customer') return 'customer';
    return undefined;
  }, [role]);

  const { data: allRoles = [] } = useRoles({
    scope: expectedScope,
    includeSystem: true,
  });

  // Filter to roles applicable to this user:
  //  - System roles are always shown (they apply to everyone in their scope).
  //  - Tenant-owned custom roles only appear when the user's tenant matches.
  const eligibleRoles = useMemo(() => {
    return allRoles.filter((r) => {
      if (!r.isActive) return false;
      if (r.isSystem) return true;
      if (!effectiveTenantId) return false;
      return r.tenantId === effectiveTenantId;
    });
  }, [allRoles, effectiveTenantId]);

  const selectedRoleId = watch('roleId');
  // Auto-select the seeded system role for this scope if nothing is picked yet
  useEffect(() => {
    if (selectedRoleId) return;
    const defaultRole = eligibleRoles.find((r) => r.isSystem && r.name === role);
    if (defaultRole) setValue('roleId', defaultRole.id);
  }, [eligibleRoles, role, selectedRoleId, setValue]);

  // Clear roleId if it no longer points to an eligible role (e.g. user changed scope)
  useEffect(() => {
    if (!selectedRoleId) return;
    const stillValid = eligibleRoles.some((r) => r.id === selectedRoleId);
    if (!stillValid) setValue('roleId', undefined);
  }, [eligibleRoles, selectedRoleId, setValue]);

  // Which steps to show based on role
  const visibleSteps = useMemo(() => {
    if (role === 'system_admin' || role === 'customer') return ['Role', 'Account', 'Review'] as const;
    return STEPS;
  }, [role]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  // pharmacy_admin can only create pharmacy_admin / pharmacy_staff → force the
  // form to a valid role on first mount.
  useEffect(() => {
    if (callerRole === 'pharmacy_admin' && (role === 'system_admin' || role === 'customer')) {
      setValue('role', 'pharmacy_staff');
    }
  }, [callerRole, role, setValue]);

  // Auto-set tenantId for pharmacy_admin caller
  useEffect(() => {
    if (lockedTenantId) setValue('tenantId', lockedTenantId);
  }, [lockedTenantId, setValue]);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft).length > 0) {
      reset({ ...DEFAULT_VALUES, ...draft, confirmPassword: draft.password ?? '' });
      if (draft.branchIds) setBranchIds(draft.branchIds);
      if (draft.primaryBranchId) setPrimaryBranchId(draft.primaryBranchId);
      setDraftRestored(true);
      const t = setTimeout(() => setDraftRestored(false), 4000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft on form change (debounced 800 ms)
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        // never persist plaintext password — keep the draft useful but safe
        const { password: _pw, confirmPassword: _cpw, ...rest } = values as FormValues;
        void _pw; void _cpw;
        saveDraft({ ...rest, branchIds, primaryBranchId });
      }, 800);
    });
    return () => {
      subscription.unsubscribe();
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [form, branchIds, primaryBranchId]);

  // Whenever tenantId changes, clear any branch selection that's no longer valid
  useEffect(() => {
    if (activeBranches.length === 0) return;
    const validIds = new Set(activeBranches.map((b) => b.id));
    setBranchIds((prev) => prev.filter((id) => validIds.has(id)));
    if (primaryBranchId && !validIds.has(primaryBranchId)) setPrimaryBranchId(undefined);
  }, [activeBranches, primaryBranchId]);

  // ─── Step navigation ──────────────────────────────────────────────────────

  const validateCurrentStep = async (): Promise<boolean> => {
    if (step === 0) {
      const ok = await form.trigger(['role']);
      return ok;
    }
    if (step === 1) {
      const ok = await form.trigger(['email', 'password', 'confirmPassword', 'phone']);
      return ok;
    }
    if (step === 2 && (role === 'pharmacy_admin' || role === 'pharmacy_staff')) {
      // Need tenant selected
      if (!effectiveTenantId) {
        setServerError('Please select a pharmacy tenant');
        return false;
      }
      if (role === 'pharmacy_staff' && branchIds.length === 0) {
        setServerError('Please assign at least one branch for pharmacy staff');
        return false;
      }
      setServerError('');
    }
    return true;
  };

  const next = async () => {
    if (!(await validateCurrentStep())) return;
    setServerError('');
    setStep((s) => Math.min(visibleSteps.length - 1, s + 1));
  };

  const prev = () => {
    setServerError('');
    setStep((s) => Math.max(0, s - 1));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    setServerError('');

    // Build the payload — strip empty strings to undefined
    const payload: ProvisionUserPayload = {
      email: data.email,
      password: data.password,
      firstName: data.firstName?.trim() || undefined,
      lastName: data.lastName?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      role: data.role,
      roleId: data.roleId || undefined,
      tenantId: effectiveTenantId || undefined,
      sendPasswordReset: data.sendPasswordReset,
    };

    if (data.role === 'pharmacy_admin' || data.role === 'pharmacy_staff') {
      if (branchIds.length > 0) {
        payload.branchAssignments = branchIds.map((branchId) => ({
          branchId,
          isPrimary: branchId === primaryBranchId,
        }));
      }
    }

    try {
      const created = await provisionUser.mutateAsync(payload);
      clearDraft();
      const newId = (created as { id?: string })?.id;
      if (newId) router.push(`/users/${newId}`);
      else router.push('/users');
    } catch (err: unknown) {
      type ApiError = { response?: { data?: { error?: string; message?: string; statusCode?: number } } };
      const body = (err as ApiError)?.response?.data;
      const msg = body?.error ?? body?.message ?? 'Failed to create user. Please try again.';
      setServerError(msg);

      // Conflict → likely the email is taken; jump back to Account step
      if (body?.statusCode === 409) {
        const accountStepIdx = visibleSteps.indexOf('Account');
        if (accountStepIdx >= 0) setStep(accountStepIdx);
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const onLastStep = step === visibleSteps.length - 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New User"
        breadcrumbs={[{ label: 'Users', href: '/users' }, { label: 'New User' }]}
        description="Provision a new platform user with their role and access scope"
      />

      {draftRestored && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          Draft restored — your previous progress has been loaded. (Password fields are intentionally not saved.)
        </div>
      )}

      <StepIndicator current={step} visibleSteps={visibleSteps} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Step: Role ── */}
        {visibleSteps[step] === 'Role' && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choose Role</div>
                <div className="text-xs text-slate-400">The role determines what the user can access</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const disabled =
                  callerRole === 'pharmacy_admin' && (r.value === 'system_admin' || r.value === 'customer');
                const selected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setValue('role', r.value, { shouldValidate: true })}
                    className={`text-left rounded-2xl p-4 border transition-all ${
                      selected
                        ? 'border-violet-500/60 bg-violet-500/10 ring-2 ring-violet-500/30'
                        : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/5'
                    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-700 dark:text-slate-200">{r.label}</div>
                        <div className="text-xs text-slate-400 mt-1">{r.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}

            {/* Role-bundle picker for system/customer roles (no Pharmacy step) */}
            {(role === 'system_admin' || role === 'customer') && eligibleRoles.length > 0 && (
              <div className="pt-4 border-t border-white/10 dark:border-white/5">
                <Field
                  label="Permission Bundle"
                  hint="Defaults to the seeded system role. Change to apply a custom permission set."
                >
                  <select {...register('roleId')} className="glass-input w-full">
                    {eligibleRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}{r.isSystem ? ' (system)' : ''} — {r.permissions.length} perms
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Account ── */}
        {visibleSteps[step] === 'Account' && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Account Details</div>
                <div className="text-xs text-slate-400">Login credentials and contact info</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="First Name">
                <input {...register('firstName')} placeholder="First name" className="glass-input w-full" />
              </Field>
              <Field label="Last Name">
                <input {...register('lastName')} placeholder="Last name" className="glass-input w-full" />
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="user@example.com" className="glass-input w-full" />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="+94 XX XXX XXXX" className="glass-input w-full" />
              </Field>
              <Field
                label="Temporary Password"
                required
                error={errors.password?.message}
                hint="At least 8 characters. User can change it on first login."
              >
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="glass-input w-full pr-16"
                    placeholder="Min 8 chars"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" required error={errors.confirmPassword?.message}>
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input w-full"
                  placeholder="Re-enter password"
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                {...register('sendPasswordReset')}
                className="glass-checkbox"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Send password reset email — user picks their own password instead of using the temporary one above
              </span>
            </label>
          </div>
        )}

        {/* ── Step: Pharmacy + Branches ── */}
        {visibleSteps[step] === 'Pharmacy' && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pharmacy & Branch Access</div>
                <div className="text-xs text-slate-400">
                  {role === 'pharmacy_admin'
                    ? 'Pharmacy admin gets tenant-wide access. Branch picks are optional homing.'
                    : 'Pharmacy staff must be assigned to at least one branch.'}
                </div>
              </div>
            </div>

            {/* Tenant picker — hidden for pharmacy_admin caller (locked to their tenant) */}
            {!lockedTenantId && (
              <Field label="Pharmacy Tenant" required>
                <select
                  {...register('tenantId')}
                  className="glass-input w-full"
                >
                  <option value="">Select a pharmacy…</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>
            )}

            {lockedTenantId && (
              <div className="rounded-xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] px-4 py-3 text-sm">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Tenant</div>
                <div className="text-slate-700 dark:text-slate-300">
                  {tenants.find((t) => t.id === lockedTenantId)?.name ?? lockedTenantId}
                  <span className="ml-2 text-xs text-slate-400">(your tenant)</span>
                </div>
              </div>
            )}

            {/* Branch multi-select — only after tenant is chosen */}
            {effectiveTenantId && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Branch Access {role === 'pharmacy_staff' && <span className="text-red-400">*</span>}
                  </Label>
                  <span className="text-xs text-slate-400">
                    {branchIds.length} of {activeBranches.length} selected
                  </span>
                </div>

                {activeBranches.length === 0 ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                    This tenant has no active branches yet. Create a branch before assigning staff.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeBranches.map((b) => {
                      const checked = branchIds.includes(b.id);
                      const isPrimary = primaryBranchId === b.id;
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            checked
                              ? 'border-blue-500/40 bg-blue-500/5'
                              : 'border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] hover:border-blue-500/20'
                          }`}
                          onClick={() => {
                            setBranchIds((prev) => {
                              if (prev.includes(b.id)) {
                                if (primaryBranchId === b.id) setPrimaryBranchId(undefined);
                                return prev.filter((id) => id !== b.id);
                              }
                              const next = [...prev, b.id];
                              if (!primaryBranchId) setPrimaryBranchId(b.id);
                              return next;
                            });
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="glass-checkbox shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{b.name}</div>
                            {b.city && <div className="text-xs text-slate-400 truncate">{b.city}</div>}
                          </div>
                          {checked && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryBranchId(isPrimary ? undefined : b.id);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isPrimary
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                              }`}
                              title={isPrimary ? 'Primary branch' : 'Mark as primary'}
                            >
                              <Star className={`w-4 h-4 ${isPrimary ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {branchIds.length > 0 && (
                  <p className="text-xs text-slate-400 mt-3">
                    <Star className="w-3 h-3 inline -mt-0.5 mr-1 fill-amber-400 text-amber-400" />
                    The starred branch is the user&apos;s &ldquo;home&rdquo; branch (auto-selected on login). Click the star to change.
                  </p>
                )}
              </div>
            )}

            {/* Role-bundle picker — depends on tenant being chosen */}
            {effectiveTenantId && eligibleRoles.length > 0 && (
              <div className="pt-4 border-t border-white/10 dark:border-white/5">
                <Field
                  label="Permission Bundle"
                  hint="System role applies by default. Pick a custom role to override the permission set."
                >
                  <select {...register('roleId')} className="glass-input w-full">
                    {eligibleRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}{r.isSystem ? ' (system)' : ''} — {r.permissions.length} perms
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Review ── */}
        {visibleSteps[step] === 'Review' && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Review & Create</div>
                <div className="text-xs text-slate-400">Confirm the details before provisioning the user</div>
              </div>
            </div>

            <ReviewSection title="Role" icon={<Shield className="w-4 h-4" />}>
              <ReviewRow label="Role" value={ROLES.find((r) => r.value === role)?.label} />
              {(() => {
                const picked = eligibleRoles.find((r) => r.id === selectedRoleId);
                if (!picked) return null;
                const suffix = picked.isSystem ? ' (system)' : ' (custom)';
                return <ReviewRow label="Permission Bundle" value={`${picked.name}${suffix} — ${picked.permissions.length} perms`} />;
              })()}
            </ReviewSection>

            <ReviewSection title="Account" icon={<UserIcon className="w-4 h-4" />}>
              <ReviewRow label="Name" value={[watch('firstName'), watch('lastName')].filter(Boolean).join(' ') || '—'} />
              <ReviewRow label="Email" value={watch('email')} />
              {watch('phone') && <ReviewRow label="Phone" value={watch('phone')} />}
              <ReviewRow label="Password Reset Email" value={watch('sendPasswordReset') ? 'Yes' : 'No'} />
            </ReviewSection>

            {(role === 'pharmacy_admin' || role === 'pharmacy_staff') && effectiveTenantId && (
              <ReviewSection title="Pharmacy & Branches" icon={<Building2 className="w-4 h-4" />}>
                <ReviewRow label="Tenant" value={tenants.find((t) => t.id === effectiveTenantId)?.name} />
                {branchIds.length > 0 && (
                  <ReviewRow
                    label="Branches"
                    value={branchIds
                      .map((id) => {
                        const b = activeBranches.find((br) => br.id === id);
                        const star = id === primaryBranchId ? ' ★' : '';
                        return b ? `${b.name}${star}` : id;
                      })
                      .join(', ')}
                  />
                )}
              </ReviewSection>
            )}
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-6">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={prev} className="rounded-xl gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={() => router.push('/users')} className="rounded-xl">
            Cancel
          </Button>
          {!onLastStep ? (
            <Button type="button" onClick={next} className="rounded-xl gap-1 glow-blue">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={provisionUser.isPending} className="rounded-xl gap-1 glow-blue">
              {provisionUser.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create User'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Review helpers ───────────────────────────────────────────────────────────

function ReviewSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {icon} {title}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm gap-3">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-700 dark:text-slate-200 font-medium text-right break-all">{value}</span>
    </div>
  );
}
