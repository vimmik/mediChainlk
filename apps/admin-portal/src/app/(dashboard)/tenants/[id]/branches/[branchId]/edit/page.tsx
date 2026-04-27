'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import { useBranch, useTenant, useUpdateBranch } from '@/hooks/useTenants';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Label } from '@medichainlk/ui';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// ─── Schema ──────────────────────────────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(2, 'Name required').max(128),
  branchCode: z.string().regex(/^[A-Za-z0-9\-_]+$/, 'Letters, numbers, - or _').max(32).optional().or(z.literal('')),
  isMainBranch: z.boolean().optional(),
  address: z.string().min(5, 'Address required').max(512),
  addressLine2: z.string().max(256).optional().or(z.literal('')),
  city: z.string().min(2, 'City required').max(128),
  district: z.string().max(128).optional().or(z.literal('')),
  province: z.string().max(128).optional().or(z.literal('')),
  postalCode: z.string().regex(/^[0-9]{4,10}$/, 'Must be 4–10 digits').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[0-9\s\-().]{7,32}$/, 'Valid phone required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  licenseNo: z.string().min(3, 'License number required').max(64),
  licenseExpiry: z.string().optional().or(z.literal('')),
  pharmacistName: z.string().max(256).optional().or(z.literal('')),
  pharmacistRegNo: z.string().regex(/^[A-Za-z0-9\-/]+$/, 'Letters, numbers, - or /').max(64).optional().or(z.literal('')),
  isOpen24h: z.boolean().optional(),
  openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM (24h)').optional().or(z.literal('')),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM (24h)').optional().or(z.literal('')),
  latitude: z.string().optional().or(z.literal('')),
  longitude: z.string().optional().or(z.literal('')),
});
type BranchForm = z.infer<typeof branchSchema>;

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="col-span-full mt-4 pb-1.5 border-b border-white/10 dark:border-white/5">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">{children}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditBranchPage() {
  const { id: tenantId, branchId } = useParams<{ id: string; branchId: string }>();
  const router = useRouter();
  const { data: tenant } = useTenant(tenantId);
  const { data: branch, isLoading } = useBranch(tenantId, branchId);
  const update = useUpdateBranch(tenantId, branchId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
  });

  // Pre-populate form once branch data loads
  useEffect(() => {
    if (!branch) return;
    reset({
      name: branch.name,
      branchCode: branch.branchCode ?? '',
      isMainBranch: branch.isMainBranch,
      address: branch.address,
      addressLine2: branch.addressLine2 ?? '',
      city: branch.city,
      district: branch.district ?? '',
      province: branch.province ?? '',
      postalCode: branch.postalCode ?? '',
      phone: branch.phone,
      email: branch.email ?? '',
      licenseNo: branch.licenseNo,
      licenseExpiry: branch.licenseExpiry ? branch.licenseExpiry.split('T')[0] : '',
      pharmacistName: branch.pharmacistName ?? '',
      pharmacistRegNo: branch.pharmacistRegNo ?? '',
      isOpen24h: branch.isOpen24h,
      openingTime: branch.openingTime ?? '',
      closingTime: branch.closingTime ?? '',
      latitude: branch.latitude != null ? String(branch.latitude) : '',
      longitude: branch.longitude != null ? String(branch.longitude) : '',
    });
  }, [branch, reset]);

  const isOpen24h = watch('isOpen24h');

  const onSubmit = async (raw: BranchForm) => {
    const payload: Record<string, unknown> = {
      ...raw,
      branchCode: raw.branchCode || undefined,
      addressLine2: raw.addressLine2 || undefined,
      district: raw.district || undefined,
      province: raw.province || undefined,
      postalCode: raw.postalCode || undefined,
      email: raw.email || undefined,
      licenseExpiry: raw.licenseExpiry || undefined,
      pharmacistName: raw.pharmacistName || undefined,
      pharmacistRegNo: raw.pharmacistRegNo || undefined,
      openingTime: raw.openingTime || undefined,
      closingTime: raw.closingTime || undefined,
      latitude: raw.latitude ? parseFloat(raw.latitude) : undefined,
      longitude: raw.longitude ? parseFloat(raw.longitude) : undefined,
    };
    try {
      await update.mutateAsync(payload);
      router.push(`/tenants/${tenantId}/branches/${branchId}`);
    } catch {
      // error toast handled in useUpdateBranch onError
    }
  };

  if (isLoading) {
    return <DetailSkeleton sections={4} fieldsPerSection={4} />;
  }

  if (!branch) {
    return (
      <div className="section-glass text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Branch not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Branch"
        breadcrumbs={[
          { label: 'Tenants', href: '/tenants' },
          { label: tenant?.name ?? '…', href: `/tenants/${tenantId}` },
          { label: branch.name, href: `/tenants/${tenantId}/branches/${branchId}` },
          { label: 'Edit' },
        ]}
        action={
          <Button
            variant="outline"
            onClick={() => router.push(`/tenants/${tenantId}/branches/${branchId}`)}
            className="gap-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
        }
      />

      <div className="section-glass">
        <div className="flex items-center gap-3 pb-4 mb-2 border-b border-white/10 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/15 to-blue-500/15 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{branch.name}</div>
            {branch.branchCode && (
              <div className="text-xs text-slate-400 font-mono">{branch.branchCode}</div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

            <SectionLabel>Basic Information</SectionLabel>
            <div className="col-span-full space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Branch Name *</Label>
              <input {...register('name')} placeholder="e.g. ABC Colombo Main" className="glass-input w-full" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Branch Code</Label>
              <input {...register('branchCode')} placeholder="COL-001" className="glass-input w-full font-mono text-sm" />
              {errors.branchCode && <p className="text-xs text-red-500">{errors.branchCode.message}</p>}
            </div>
            <div className="flex items-center gap-2.5 pt-5">
              <input type="checkbox" id="isMainBranch" {...register('isMainBranch')} className="w-4 h-4 rounded accent-violet-500" />
              <Label htmlFor="isMainBranch" className="font-normal cursor-pointer text-slate-600 dark:text-slate-300 text-sm">Main branch</Label>
            </div>

            <SectionLabel>Address</SectionLabel>
            <div className="col-span-full space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Address Line 1 *</Label>
              <input {...register('address')} placeholder="123 Main Street" className="glass-input w-full" />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div className="col-span-full space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Address Line 2</Label>
              <input {...register('addressLine2')} placeholder="Suite / Floor (optional)" className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">City *</Label>
              <input {...register('city')} placeholder="Colombo" className="glass-input w-full" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">District</Label>
              <input {...register('district')} placeholder="Colombo" className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Province</Label>
              <input {...register('province')} placeholder="Western" className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Postal Code</Label>
              <input {...register('postalCode')} placeholder="10100" className="glass-input w-full" />
              {errors.postalCode && <p className="text-xs text-red-500">{errors.postalCode.message}</p>}
            </div>

            <SectionLabel>Contact</SectionLabel>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Phone *</Label>
              <input {...register('phone')} placeholder="+94112345678" className="glass-input w-full" />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Email</Label>
              <input {...register('email')} type="email" placeholder="colombo@pharmacy.lk" className="glass-input w-full" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <SectionLabel>Licensing &amp; Pharmacist</SectionLabel>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">License No. *</Label>
              <input {...register('licenseNo')} placeholder="PH-LK-2024-001" className="glass-input w-full font-mono text-sm" />
              {errors.licenseNo && <p className="text-xs text-red-500">{errors.licenseNo.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">License Expiry</Label>
              <input {...register('licenseExpiry')} type="date" className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Pharmacist Name</Label>
              <input {...register('pharmacistName')} placeholder="Dr. Kamal Fernando" className="glass-input w-full" />
              {errors.pharmacistName && <p className="text-xs text-red-500">{errors.pharmacistName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Pharmacist Reg. No.</Label>
              <input {...register('pharmacistRegNo')} placeholder="SLMC-54321" className="glass-input w-full font-mono text-sm" />
              {errors.pharmacistRegNo && <p className="text-xs text-red-500">{errors.pharmacistRegNo.message}</p>}
            </div>

            <SectionLabel>Operating Hours</SectionLabel>
            <div className="col-span-full flex items-center gap-2.5">
              <input type="checkbox" id="isOpen24h" {...register('isOpen24h')} className="w-4 h-4 rounded accent-blue-500" />
              <Label htmlFor="isOpen24h" className="font-normal cursor-pointer text-slate-600 dark:text-slate-300 text-sm">Open 24 hours</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Opening Time</Label>
              <input {...register('openingTime')} type="time" disabled={!!isOpen24h} className="glass-input w-full disabled:opacity-40" />
              {errors.openingTime && <p className="text-xs text-red-500">{errors.openingTime.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Closing Time</Label>
              <input {...register('closingTime')} type="time" disabled={!!isOpen24h} className="glass-input w-full disabled:opacity-40" />
              {errors.closingTime && <p className="text-xs text-red-500">{errors.closingTime.message}</p>}
            </div>

            <SectionLabel>GPS Coordinates (optional)</SectionLabel>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Latitude</Label>
              <input {...register('latitude')} placeholder="6.9271" className="glass-input w-full" />
              {errors.latitude && <p className="text-xs text-red-500">{errors.latitude.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Longitude</Label>
              <input {...register('longitude')} placeholder="79.8612" className="glass-input w-full" />
              {errors.longitude && <p className="text-xs text-red-500">{errors.longitude.message}</p>}
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-white/10 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/tenants/${tenantId}/branches/${branchId}`)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue min-w-[120px]">
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
