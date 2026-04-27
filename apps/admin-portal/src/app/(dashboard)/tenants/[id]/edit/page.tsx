'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import { districtsByProvince, provinces, type Province } from '@/data/srilanka';
import { useDeactivateTenant, useReactivateTenant, useTenant, useUpdateTenant } from '@/hooks/useTenants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Label, Textarea } from '@medichainlk/ui';
import { Building2, Globe, MapPin, Power, PowerOff, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  legalName: z.string().optional(),
  registrationNo: z.string().optional(),
  taxId: z.string().optional(),
  businessType: z.enum(['sole_proprietorship', 'partnership', 'pvt_ltd', 'plc']).optional().or(z.literal('')),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  subscriptionPlan: z.enum(['free', 'basic', 'professional', 'enterprise']).optional().or(z.literal('')),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}{required && <span className="text-red-400"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(id);
  const update = useUpdateTenant(id);
  const deactivate = useDeactivateTenant();
  const reactivate = useReactivateTenant();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedProvince = watch('province') as Province | undefined;
  const districts = selectedProvince ? districtsByProvince[selectedProvince] ?? [] : [];

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name ?? '',
        slug: tenant.slug ?? '',
        legalName: tenant.legalName ?? '',
        registrationNo: tenant.registrationNo ?? '',
        taxId: tenant.taxId ?? '',
        businessType: tenant.businessType ?? '',
        email: tenant.email ?? '',
        phone: tenant.phone ?? '',
        website: tenant.website ?? '',
        subscriptionPlan: tenant.subscriptionPlan ?? '',
        addressLine1: tenant.addressLine1 ?? '',
        addressLine2: tenant.addressLine2 ?? '',
        city: tenant.city ?? '',
        district: tenant.district ?? '',
        province: tenant.province ?? '',
        postalCode: tenant.postalCode ?? '',
        notes: tenant.notes ?? '',
      });
    }
  }, [tenant, reset]);

  const onSubmit = async (data: FormValues) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v]),
    );
    await update.mutateAsync(cleaned);
    router.push(`/tenants/${id}`);
  };

  const handleToggleActive = async () => {
    if (!tenant) return;
    if (tenant.isActive) {
      await deactivate.mutateAsync(id);
    } else {
      await reactivate.mutateAsync(id);
    }
    router.push(`/tenants/${id}`);
  };

  if (isLoading) {
    return <DetailSkeleton sections={3} fieldsPerSection={4} />;
  }

  if (!tenant) {
    return (
      <div className="section-glass text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Tenant not found.</p>
        <Link href="/tenants" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
          Back to tenants
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Tenant"
        breadcrumbs={[
          { label: 'Tenants', href: '/tenants' },
          { label: tenant.name, href: `/tenants/${id}` },
          { label: 'Edit' },
        ]}
        badge={
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tenant.isActive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
          }`}>
            <span className={`status-dot ${tenant.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
            {tenant.isActive ? 'Active' : 'Inactive'}
          </span>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Business Details ── */}
        <div className="section-glass space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Details</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Brand Name" required error={errors.name?.message}>
              <input {...register('name')} placeholder="ABC Pharmacy" className="glass-input w-full" />
            </Field>
            <Field label="URL Slug" required error={errors.slug?.message}>
              <div className="flex items-center">
                <span className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/[0.03] text-slate-400 text-xs select-none">
                  medichainlk.lk/
                </span>
                <input {...register('slug')} placeholder="abc-pharmacy" className="glass-input w-full rounded-l-none font-mono text-sm" />
              </div>
            </Field>
            <Field label="Legal Name" error={errors.legalName?.message}>
              <input {...register('legalName')} placeholder="ABC Pvt Ltd" className="glass-input w-full" />
            </Field>
            <Field label="Registration No" error={errors.registrationNo?.message}>
              <input {...register('registrationNo')} placeholder="PV 12345" className="glass-input w-full" />
            </Field>
            <Field label="Tax ID" error={errors.taxId?.message}>
              <input {...register('taxId')} placeholder="123456789-0000" className="glass-input w-full" />
            </Field>
            <Field label="Business Type">
              <select {...register('businessType')} className="glass-input w-full">
                <option value="">Select…</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="pvt_ltd">Private Limited</option>
                <option value="plc">PLC</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── Contact & Web ── */}
        <div className="section-glass space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact & Web</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="info@pharmacy.lk" className="glass-input w-full" />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="+94 11 234 5678" className="glass-input w-full" />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <input {...register('website')} placeholder="https://pharmacy.lk" className="glass-input w-full" />
            </Field>
            <Field label="Subscription Plan">
              <select {...register('subscriptionPlan')} className="glass-input w-full">
                <option value="">Select…</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>
          </div>
        </div>

        {/* ── Address ── */}
        <div className="section-glass space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Address</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Address Line 1">
                <input {...register('addressLine1')} placeholder="Street address" className="glass-input w-full" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address Line 2">
                <input {...register('addressLine2')} placeholder="Additional address" className="glass-input w-full" />
              </Field>
            </div>
            <Field label="Province">
              <select {...register('province')} className="glass-input w-full">
                <option value="">Select…</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="District">
              <select {...register('district')} className="glass-input w-full" disabled={!selectedProvince}>
                <option value="">Select…</option>
                {districts.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <input {...register('city')} placeholder="Colombo" className="glass-input w-full" />
            </Field>
            <Field label="Postal Code">
              <input {...register('postalCode')} placeholder="00300" className="glass-input w-full" />
            </Field>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="section-glass space-y-4">
          <Field label="Notes">
            <Textarea {...register('notes')} placeholder="Internal notes about this tenant…" className="glass-input w-full min-h-[80px]" />
          </Field>
        </div>

        {/* Server error */}
        {update.isError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {(update.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save changes. Please try again.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/tenants/${id}`)}
            className="rounded-xl flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="rounded-xl flex-1 glow-blue gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="section-glass border border-red-500/10 dark:border-red-500/10 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Danger Zone</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {tenant.isActive
              ? 'Deactivating this tenant will disable all its branches and prevent staff from logging in.'
              : 'Reactivating this tenant will restore access for all its branches and staff.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleToggleActive}
            disabled={deactivate.isPending || reactivate.isPending}
            className={`gap-2 rounded-xl ${
              tenant.isActive
                ? 'text-red-500 border-red-200 dark:border-red-900/40 hover:bg-red-500/10'
                : 'text-emerald-600 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-500/10'
            }`}
          >
            {tenant.isActive ? (
              <>
                <PowerOff className="w-4 h-4" />
                {deactivate.isPending ? 'Deactivating…' : 'Deactivate Tenant'}
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                {reactivate.isPending ? 'Reactivating…' : 'Reactivate Tenant'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
