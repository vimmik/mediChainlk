'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { districtsByProvince, provinces, type Province } from '@/data/srilanka';
import api from '@/lib/api';
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
  Phone,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';

// ─── Draft persistence ───────────────────────────────────────────────────────

const DRAFT_KEY = 'medi-new-tenant-draft';

function saveDraft(values: FormValues) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch { /* quota exceeded — silent */ }
}

function loadDraft(): Partial<FormValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<FormValues>) : null;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function autoSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const STEPS = ['Business Info', 'Owner', 'Contacts', 'Review'] as const;

// ─── Schema ──────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  contactType: z.enum(['primary', 'billing', 'technical', 'emergency']),
  name: z.string().min(1, 'Required'),
  designation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  isPrimary: z.boolean().optional(),
});

const schema = z.object({
  // Step 1 — Business Info
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  legalName: z.string().optional(),
  registrationNo: z.string().optional(),
  taxId: z.string().optional(),
  businessType: z.enum(['sole_proprietorship', 'partnership', 'pvt_ltd', 'plc']).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  subscriptionPlan: z.enum(['free', 'basic', 'professional', 'enterprise']).optional(),
  notes: z.string().optional(),

  // Step 2 — Owner
  ownerFullName: z.string().optional(),
  ownerNic: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email('Invalid email').or(z.literal('')).optional(),
  ownerSlmcRegNo: z.string().optional(),
  ownerQualification: z.string().optional(),

  // Step 3 — Contacts
  contacts: z.array(contactSchema).optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  name: '',
  slug: '',
  subscriptionPlan: 'free',
  contacts: [{ contactType: 'primary', name: '', designation: '', phone: '', email: '', isPrimary: true }],
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <nav className="flex items-center gap-3 mb-8">
      {STEPS.map((label, i) => {
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
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/10" />}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTenantPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);

  // Debounce timer ref for draft saving
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const { register, handleSubmit, setValue, watch, reset, control, trigger, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  const nameValue = watch('name', '');
  const selectedProvince = watch('province') as Province | undefined;

  // ─── Restore draft on mount ───────────────────────────────────────────────

  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft).length > 0) {
      reset({ ...DEFAULT_VALUES, ...draft });
      setDraftRestored(true);
      // Auto-dismiss the banner after 4s
      const t = setTimeout(() => setDraftRestored(false), 4000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-save draft on every form change (debounced 800 ms) ─────────────

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        saveDraft(values as FormValues);
      }, 800);
    });
    return () => {
      subscription.unsubscribe();
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [form]);

  // ─── Step navigation ──────────────────────────────────────────────────────

  const next = async () => {
    let valid = true;
    if (step === 0) {
      valid = await trigger(['name', 'slug', 'email', 'businessType', 'subscriptionPlan']);
    }
    if (valid) {
      setServerError('');
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  };

  const prev = () => {
    setServerError('');
    setStep((s) => Math.max(0, s - 1));
  };

  // ─── Submit — single atomic /provision call ───────────────────────────────

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setServerError('');
    try {
      const payload = {
        tenant: {
          name: data.name,
          slug: data.slug,
          legalName: data.legalName || undefined,
          registrationNo: data.registrationNo || undefined,
          taxId: data.taxId || undefined,
          businessType: data.businessType || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          website: data.website || undefined,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          district: data.district || undefined,
          province: data.province || undefined,
          postalCode: data.postalCode || undefined,
          subscriptionPlan: data.subscriptionPlan || undefined,
          notes: data.notes || undefined,
        },
        // Owner — omit entirely if fullName is empty
        ...(data.ownerFullName?.trim() ? {
          owner: {
            fullName: data.ownerFullName.trim(),
            nic: data.ownerNic || undefined,
            phone: data.ownerPhone || undefined,
            email: data.ownerEmail || undefined,
            slmcRegNo: data.ownerSlmcRegNo || undefined,
            qualification: data.ownerQualification || undefined,
          },
        } : {}),
        // Contacts — only rows with a name filled in
        contacts: (data.contacts ?? [])
          .filter((c) => c.name?.trim())
          .map((c) => ({
            contactType: c.contactType,
            name: c.name.trim(),
            designation: c.designation || undefined,
            phone: c.phone || undefined,
            email: c.email || undefined,
            isPrimary: c.isPrimary ?? false,
          })),
      };

      const res = await api.post('/tenants/provision', payload);
      const tenantId = (res.data?.data?.id ?? res.data?.id) as string;

      // All writes committed — clear the draft and invalidate the list
      clearDraft();
      qc.invalidateQueries({ queryKey: ['tenants'] });

      router.push(`/tenants/${tenantId}`);
    } catch (err: unknown) {
      // HttpExceptionFilter: { success: false, error: string, statusCode, code }
      type ApiError = { response?: { data?: { error?: string; message?: string; statusCode?: number } } };
      const body = (err as ApiError)?.response?.data;
      const msg = body?.error ?? body?.message ?? 'Failed to create tenant. Please try again.';
      setServerError(msg);

      // Jump back to step 0 if the conflict is on slug or registration number
      if (body?.statusCode === 409) {
        const lower = msg.toLowerCase();
        if (lower.includes('slug') || lower.includes('registration')) {
          setStep(0);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Pharmacy Tenant"
        breadcrumbs={[
          { label: 'Tenants', href: '/tenants' },
          { label: 'New Tenant' },
        ]}
        description="Register a new pharmacy brand on MediChainLK"
      />

      {/* Draft restored banner */}
      {draftRestored && (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          Draft restored — your previous progress has been loaded.
        </div>
      )}

      <StepIndicator current={step} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Step 1: Business Info ── */}
        {step === 0 && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Information</div>
                <div className="text-xs text-slate-400">Basic pharmacy brand details</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Brand Name" required error={errors.name?.message}>
                <input
                  {...register('name', { onChange: (e) => setValue('slug', autoSlug(e.target.value)) })}
                  placeholder="e.g. ABC Pharmacy"
                  className="glass-input w-full"
                />
              </Field>

              <Field label="URL Slug" required error={errors.slug?.message} hint="Auto-generated. Cannot change later.">
                <div className="flex items-center">
                  <span className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/[0.03] text-slate-400 text-xs select-none">
                    medichainlk.lk/
                  </span>
                  <input {...register('slug')} className="glass-input w-full rounded-l-none font-mono text-sm" />
                </div>
              </Field>

              <Field label="Legal Name" error={errors.legalName?.message}>
                <input {...register('legalName')} placeholder="As per registration" className="glass-input w-full" />
              </Field>

              <Field label="Registration No" error={errors.registrationNo?.message}>
                <input {...register('registrationNo')} placeholder="PV12345" className="glass-input w-full" />
              </Field>

              <Field label="Tax ID" error={errors.taxId?.message}>
                <input {...register('taxId')} placeholder="Tax identification number" className="glass-input w-full" />
              </Field>

              <Field label="Business Type">
                <select {...register('businessType')} className="glass-input w-full">
                  <option value="">Select type</option>
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="pvt_ltd">Private Limited</option>
                  <option value="plc">Public Limited (PLC)</option>
                </select>
              </Field>

              <Field label="Email" error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="info@pharmacy.lk" className="glass-input w-full" />
              </Field>

              <Field label="Phone">
                <input {...register('phone')} placeholder="+94 XX XXX XXXX" className="glass-input w-full" />
              </Field>

              <Field label="Website">
                <input {...register('website')} placeholder="https://pharmacy.lk" className="glass-input w-full" />
              </Field>

              <Field label="Subscription Plan">
                <select {...register('subscriptionPlan')} className="glass-input w-full">
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </Field>
            </div>

            {/* Address section */}
            <div className="pt-4 border-t border-white/10 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Address Line 1">
                  <input {...register('addressLine1')} placeholder="Street address" className="glass-input w-full" />
                </Field>
                <Field label="Address Line 2">
                  <input {...register('addressLine2')} placeholder="Apt, suite, etc." className="glass-input w-full" />
                </Field>
                <Field label="Province">
                  <select {...register('province')} className="glass-input w-full">
                    <option value="">Select province</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="District">
                  <select {...register('district')} className="glass-input w-full">
                    <option value="">Select district</option>
                    {selectedProvince && districtsByProvince[selectedProvince]?.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="City">
                  <input {...register('city')} placeholder="City" className="glass-input w-full" />
                </Field>
                <Field label="Postal Code">
                  <input {...register('postalCode')} placeholder="e.g. 10100" className="glass-input w-full" />
                </Field>
              </div>
            </div>

            <Field label="Notes">
              <textarea {...register('notes')} rows={3} placeholder="Internal notes about this tenant…" className="glass-input w-full resize-none" />
            </Field>
          </div>
        )}

        {/* ── Step 2: Owner ── */}
        {step === 1 && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Owner Details</div>
                <div className="text-xs text-slate-400">Pharmacy owner / responsible pharmacist (optional)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Full Name">
                <input {...register('ownerFullName')} placeholder="Pharmacist name" className="glass-input w-full" />
              </Field>
              <Field label="NIC Number">
                <input {...register('ownerNic')} placeholder="National ID" className="glass-input w-full" />
              </Field>
              <Field label="Phone">
                <input {...register('ownerPhone')} placeholder="+94 XX XXX XXXX" className="glass-input w-full" />
              </Field>
              <Field label="Email" error={errors.ownerEmail?.message}>
                <input {...register('ownerEmail')} type="email" placeholder="owner@email.com" className="glass-input w-full" />
              </Field>
              <Field label="SLMC Registration No" hint="Sri Lanka Medical Council registration">
                <input {...register('ownerSlmcRegNo')} placeholder="SLMC-XXXXX" className="glass-input w-full" />
              </Field>
              <Field label="Qualification">
                <input {...register('ownerQualification')} placeholder="B.Pharm, M.Pharm, etc." className="glass-input w-full" />
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 3: Contacts ── */}
        {step === 2 && (
          <div className="section-glass space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contacts</div>
                  <div className="text-xs text-slate-400">Key people at the pharmacy (optional)</div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-1"
                onClick={() => append({ contactType: 'billing', name: '', designation: '', phone: '', email: '', isPrimary: false })}
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </Button>
            </div>

            {fields.map((field, i) => (
              <div key={field.id} className="glass-card rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact {i + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10" onClick={() => remove(i)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Type">
                    <select {...register(`contacts.${i}.contactType`)} className="glass-input w-full">
                      <option value="primary">Primary</option>
                      <option value="billing">Billing</option>
                      <option value="technical">Technical</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </Field>
                  <Field label="Name" required error={errors.contacts?.[i]?.name?.message}>
                    <input {...register(`contacts.${i}.name`)} placeholder="Contact name" className="glass-input w-full" />
                  </Field>
                  <Field label="Designation">
                    <input {...register(`contacts.${i}.designation`)} placeholder="Chief Pharmacist" className="glass-input w-full" />
                  </Field>
                  <Field label="Phone">
                    <input {...register(`contacts.${i}.phone`)} placeholder="+94 XX XXX XXXX" className="glass-input w-full" />
                  </Field>
                  <Field label="Email" error={errors.contacts?.[i]?.email?.message}>
                    <input {...register(`contacts.${i}.email`)} type="email" placeholder="person@pharmacy.lk" className="glass-input w-full" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 3 && (
          <div className="section-glass space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Review & Submit</div>
                <div className="text-xs text-slate-400">Confirm the details before creating the tenant</div>
              </div>
            </div>

            <ReviewSection title="Business Info" icon={<Building2 className="w-4 h-4" />}>
              <ReviewRow label="Brand Name" value={watch('name')} />
              <ReviewRow label="Slug" value={`/${watch('slug')}`} />
              {watch('legalName') && <ReviewRow label="Legal Name" value={watch('legalName')} />}
              {watch('registrationNo') && <ReviewRow label="Registration No" value={watch('registrationNo')} />}
              {watch('businessType') && <ReviewRow label="Business Type" value={watch('businessType')?.replace(/_/g, ' ')} />}
              {watch('email') && <ReviewRow label="Email" value={watch('email')} />}
              {watch('phone') && <ReviewRow label="Phone" value={watch('phone')} />}
              {watch('city') && <ReviewRow label="Location" value={[watch('city'), watch('district'), watch('province')].filter(Boolean).join(', ')} />}
              <ReviewRow label="Plan" value={watch('subscriptionPlan') ?? 'free'} />
            </ReviewSection>

            {watch('ownerFullName') && (
              <ReviewSection title="Owner" icon={<User className="w-4 h-4" />}>
                <ReviewRow label="Name" value={watch('ownerFullName')} />
                {watch('ownerNic') && <ReviewRow label="NIC" value={watch('ownerNic')} />}
                {watch('ownerPhone') && <ReviewRow label="Phone" value={watch('ownerPhone')} />}
                {watch('ownerEmail') && <ReviewRow label="Email" value={watch('ownerEmail')} />}
                {watch('ownerSlmcRegNo') && <ReviewRow label="SLMC Reg" value={watch('ownerSlmcRegNo')} />}
              </ReviewSection>
            )}

            {(watch('contacts') ?? []).filter(c => c.name).length > 0 && (
              <ReviewSection title="Contacts" icon={<Phone className="w-4 h-4" />}>
                {(watch('contacts') ?? []).filter(c => c.name).map((c, i) => (
                  <ReviewRow key={i} label={c.contactType} value={`${c.name}${c.phone ? ` — ${c.phone}` : ''}`} />
                ))}
              </ReviewSection>
            )}

            {nameValue.length >= 2 && (
              <div className="rounded-xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] px-4 py-3 text-sm">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1.5">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400">
                    {nameValue[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-700 dark:text-slate-300">{nameValue}</div>
                    <div className="text-xs text-slate-400 font-mono">/{autoSlug(nameValue)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Server error (visible on any step after a failed submit) ── */}
        {serverError && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{serverError}</span>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center gap-3 pt-6">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={prev} className="rounded-xl gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={() => router.push('/tenants')} className="rounded-xl">
            Cancel
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next} className="rounded-xl gap-1 glow-blue">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="rounded-xl gap-1 glow-blue">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Tenant'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Review helpers ────────────────────────────────────────────────────────────

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
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-medium text-right">{value}</span>
    </div>
  );
}
