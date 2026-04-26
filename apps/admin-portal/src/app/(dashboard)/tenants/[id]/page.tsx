'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';
import {
    useContacts,
    useCreateContact,
    useCreateDocument,
    useDeactivateBranch,
    useDeleteContact,
    useDeleteDocument,
    useDocuments,
    useOwner,
    useTenant,
    useUnverifyTenant,
    useUpsertOwner,
    useVerifyTenant,
} from '@/hooks/useTenants';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
    PharmacyBranch,
    TenantContact,
    TenantDocument
} from '@medichainlk/shared-types';
import {
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Label,
} from '@medichainlk/ui';
import {
    Building2,
    Calendar,
    Clock,
    CreditCard,
    ExternalLink,
    Eye,
    FileText,
    GitBranch,
    Globe,
    Hash,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    PowerOff,
    ShieldCheck,
    ShieldX,
    Star,
    Trash2,
    User,
    UserCheck,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'owner' | 'contacts' | 'documents' | 'branches';

// ─── Contact Modal ──────────────────────────────────────────────────────────

const contactSchema = z.object({
  contactType: z.enum(['primary', 'billing', 'technical', 'emergency']),
  name: z.string().min(1, 'Name required'),
  designation: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  isPrimary: z.boolean().optional(),
});
type ContactForm = z.infer<typeof contactSchema>;

function AddContactModal({ tenantId, open, onClose }: { tenantId: string; open: boolean; onClose: () => void }) {
  const create = useCreateContact(tenantId);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contactType: 'primary', isPrimary: false },
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      await create.mutateAsync(data as Record<string, unknown>);
      reset();
      onClose();
    } catch {
      // error toast is handled in useCreateContact onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md glass-card border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Add Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Type</Label>
              <select {...register('contactType')} className="glass-input w-full">
                <option value="primary">Primary</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Name *</Label>
              <input {...register('name')} placeholder="Contact name" className="glass-input w-full" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Designation</Label>
              <input {...register('designation')} placeholder="Chief Pharmacist" className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Phone</Label>
              <input {...register('phone')} placeholder="+94 XX XXX XXXX" className="glass-input w-full" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Email</Label>
              <input {...register('email')} type="email" placeholder="person@pharmacy.lk" className="glass-input w-full" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
              {isSubmitting ? 'Adding…' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Modal ─────────────────────────────────────────────────────────

const documentSchema = z.object({
  documentType: z.enum(['business_registration', 'pharmacy_license', 'nmra_certificate', 'tax_certificate', 'insurance', 'other']),
  title: z.string().min(1, 'Title required'),
  fileUrl: z.string().url('Must be a valid URL'),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});
type DocumentForm = z.infer<typeof documentSchema>;

function AddDocumentModal({ tenantId, open, onClose }: { tenantId: string; open: boolean; onClose: () => void }) {
  const create = useCreateDocument(tenantId);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
    defaultValues: { documentType: 'business_registration' },
  });

  const onSubmit = async (data: DocumentForm) => {
    try {
      await create.mutateAsync(data as Record<string, unknown>);
      reset();
      onClose();
    } catch {
      // error toast is handled in useCreateDocument onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md glass-card border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-slate-200">Add Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Type</Label>
              <select {...register('documentType')} className="glass-input w-full">
                <option value="business_registration">Business Registration</option>
                <option value="pharmacy_license">Pharmacy License</option>
                <option value="nmra_certificate">NMRA Certificate</option>
                <option value="tax_certificate">Tax Certificate</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Title *</Label>
              <input {...register('title')} placeholder="Document title" className="glass-input w-full" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">File URL *</Label>
              <input {...register('fileUrl')} placeholder="https://s3.amazonaws.com/..." className="glass-input w-full" />
              {errors.fileUrl && <p className="text-xs text-red-500">{errors.fileUrl.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Expiry Date</Label>
              <input {...register('expiryDate')} type="date" className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600 dark:text-slate-400 text-xs">Notes</Label>
              <input {...register('notes')} placeholder="Optional notes" className="glass-input w-full" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
              {isSubmitting ? 'Adding…' : 'Add Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Owner Form ─────────────────────────────────────────────────────────────

const ownerSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  nic: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  slmcRegNo: z.string().optional(),
  qualification: z.string().optional(),
});
type OwnerForm = z.infer<typeof ownerSchema>;

function OwnerTab({ tenantId }: { tenantId: string }) {
  const { data: owner, isLoading } = useOwner(tenantId);
  const upsert = useUpsertOwner(tenantId);
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<OwnerForm>({
    resolver: zodResolver(ownerSchema),
  });

  const startEdit = () => {
    if (owner) {
      reset({
        fullName: owner.fullName ?? '',
        nic: owner.nic ?? '',
        phone: owner.phone ?? '',
        email: owner.email ?? '',
        slmcRegNo: owner.slmcRegNo ?? '',
        qualification: owner.qualification ?? '',
      });
    } else {
      reset({ fullName: '', nic: '', phone: '', email: '', slmcRegNo: '', qualification: '' });
    }
    setEditing(true);
  };

  const onSubmit = async (data: OwnerForm) => {
    try {
      await upsert.mutateAsync(data as Record<string, unknown>);
      setEditing(false);
    } catch {
      // error toast is handled in useUpsertOwner onError
    }
  };

  if (isLoading) return <DetailSkeleton sections={1} fieldsPerSection={6} />;

  if (editing) {
    return (
      <div className="section-glass space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10 dark:border-white/5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center">
            <User className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{owner ? 'Edit Owner' : 'Add Owner'}</div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Full Name *</Label>
              <input {...register('fullName')} className="glass-input w-full" />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">NIC</Label>
              <input {...register('nic')} className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Phone</Label>
              <input {...register('phone')} className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Email</Label>
              <input {...register('email')} type="email" className="glass-input w-full" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">SLMC Reg No</Label>
              <input {...register('slmcRegNo')} className="glass-input w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 dark:text-slate-400">Qualification</Label>
              <input {...register('qualification')} className="glass-input w-full" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl glow-blue">
              {isSubmitting ? 'Saving…' : 'Save Owner'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (!owner) {
    return (
      <EmptyState
        icon={User}
        title="No owner set"
        description="Add the pharmacy owner or responsible pharmacist"
        action={<Button onClick={startEdit} className="gap-2 rounded-xl glow-blue"><Plus className="w-4 h-4" /> Add Owner</Button>}
      />
    );
  }

  return (
    <div className="section-glass space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500/15 to-teal-500/15 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-800 dark:text-slate-200">{owner.fullName}</div>
            {owner.qualification && <div className="text-xs text-slate-400">{owner.qualification}</div>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startEdit} className="rounded-xl gap-1">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="NIC" value={owner.nic} />
        <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={owner.phone} />
        <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={owner.email} />
        <InfoRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label="SLMC Reg" value={owner.slmcRegNo} />
      </div>
    </div>
  );
}

// ─── Branch Card ────────────────────────────────────────────────────────────

function BranchCard({ branch, tenantId }: { branch: PharmacyBranch & { _count?: { staff: number } }; tenantId: string }) {
  const deactivate = useDeactivateBranch(tenantId);

  const hoursLabel = branch.isOpen24h
    ? '24 hrs'
    : branch.openingTime && branch.closingTime
    ? `${branch.openingTime} – ${branch.closingTime}`
    : null;

  return (
    <div className="section-glass hover-lift group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500/15 to-blue-500/15 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-500/70" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              {branch.name}
              {branch.isMainBranch && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {branch.city}{branch.district ? `, ${branch.district}` : ''}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          branch.isActive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
        }`}>
          <span className={`status-dot ${branch.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 mb-4">{branch.address}</div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-4 pt-3 border-t border-white/10 dark:border-white/5">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{branch.phone}</span>
        <span className="font-mono flex items-center gap-1"><ShieldCheck className="w-3 h-3" />{branch.licenseNo}</span>
        {hoursLabel && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{hoursLabel}</span>}
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{branch._count?.staff ?? 0} staff</span>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/tenants/${tenantId}/branches/${branch.id}`}>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg text-xs hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
            <Eye className="w-3.5 h-3.5" />
            Manage Staff
          </Button>
        </Link>
        {branch.isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            onClick={() => deactivate.mutate(branch.id)}
            disabled={deactivate.isPending}
          >
            <PowerOff className="w-3.5 h-3.5" />
            Deactivate
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Info row helper ────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
        <div className="text-slate-700 dark:text-slate-300">{value}</div>
      </div>
    </div>
  );
}

// ─── Plan badge colors ──────────────────────────────────────────────────────

const planColors: Record<string, string> = {
  free: 'bg-slate-500/10 text-slate-400',
  basic: 'bg-blue-500/10 text-blue-400',
  professional: 'bg-violet-500/10 text-violet-400',
  enterprise: 'bg-amber-500/10 text-amber-400',
};

// ─── Contact type badge ─────────────────────────────────────────────────────

const contactTypeColors: Record<string, string> = {
  primary: 'bg-emerald-500/10 text-emerald-400',
  billing: 'bg-blue-500/10 text-blue-400',
  technical: 'bg-violet-500/10 text-violet-400',
  emergency: 'bg-red-500/10 text-red-400',
};

// ─── Document type label ────────────────────────────────────────────────────

const docTypeLabels: Record<string, string> = {
  business_registration: 'Business Registration',
  pharmacy_license: 'Pharmacy License',
  nmra_certificate: 'NMRA Certificate',
  tax_certificate: 'Tax Certificate',
  insurance: 'Insurance',
  other: 'Other',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: tenant, isLoading } = useTenant(id);
  const [tab, setTab] = useState<Tab>('overview');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);

  const verify = useVerifyTenant();
  const unverify = useUnverifyTenant();
  const { data: contactsList } = useContacts(id);
  const deleteContact = useDeleteContact(id);
  const { data: documentsList } = useDocuments(id);
  const deleteDocument = useDeleteDocument(id);

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

  const initials = tenant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const contacts = (contactsList ?? tenant.contacts ?? []) as TenantContact[];
  const documents = (documentsList ?? tenant.documents ?? []) as TenantDocument[];
  const branches = (tenant.branches ?? []) as (PharmacyBranch & { _count?: { staff: number } })[];

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'owner', label: 'Owner' },
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'documents', label: 'Documents', count: documents.length },
    { key: 'branches', label: 'Branches', count: branches.length },
  ];

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={tenant.name}
          breadcrumbs={[{ label: 'Tenants', href: '/tenants' }, { label: tenant.name }]}
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
          action={
            <Link href={`/tenants/${id}/edit`}>
              <Button variant="outline" className="gap-2 rounded-xl">
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          }
        />

        {/* Header card */}
        <div className="section-glass flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-xl font-bold text-violet-600 dark:text-violet-400">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{tenant.name}</div>
            <div className="text-sm text-slate-400 dark:text-slate-500 font-mono">/{tenant.slug}</div>
          </div>
          <div className="flex items-center gap-2">
            {tenant.isVerified ? (
              <Badge className="bg-emerald-500/10 text-emerald-400 gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-400 gap-1"><ShieldX className="w-3 h-3" /> Unverified</Badge>
            )}
            <Badge className={planColors[tenant.subscriptionPlan ?? 'free']}>{tenant.subscriptionPlan ?? 'free'}</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Branches', value: tenant._count?.branches ?? branches.length, icon: GitBranch, gradient: 'from-blue-500/15 to-cyan-500/15', iconColor: 'text-blue-500' },
            { label: 'Total Staff', value: branches.reduce((sum: number, b) => sum + (b._count?.staff ?? 0), 0), icon: Users, gradient: 'from-violet-500/15 to-purple-500/15', iconColor: 'text-violet-500' },
            { label: 'Pharmacy Admins', value: tenant.users?.length ?? 0, icon: UserCheck, gradient: 'from-emerald-500/15 to-teal-500/15', iconColor: 'text-emerald-500' },
            { label: 'Documents', value: documents.length, icon: FileText, gradient: 'from-amber-500/15 to-orange-500/15', iconColor: 'text-amber-500' },
          ].map((stat) => (
            <div key={stat.label} className="stat-mini">
              <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-white/10 dark:bg-white/8 text-slate-800 dark:text-white shadow-sm border border-white/20 dark:border-white/10'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business details */}
            <div className="section-glass space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 dark:border-white/5">
                <Building2 className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Details</span>
              </div>
              <div className="space-y-3">
                <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Legal Name" value={tenant.legalName} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Registration No" value={tenant.registrationNo} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="Tax ID" value={tenant.taxId} />
                <InfoRow icon={<CreditCard className="w-3.5 h-3.5" />} label="Business Type" value={tenant.businessType?.replace(/_/g, ' ')} />
                <InfoRow icon={<CreditCard className="w-3.5 h-3.5" />} label="Plan" value={tenant.subscriptionPlan} />
                {tenant.subscriptionExpiry && (
                  <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Plan Expires" value={new Date(tenant.subscriptionExpiry).toLocaleDateString()} />
                )}
              </div>
            </div>

            {/* Contact / Location */}
            <div className="section-glass space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 dark:border-white/5">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact & Location</span>
              </div>
              <div className="space-y-3">
                <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={tenant.email} />
                <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={tenant.phone} />
                <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="Website" value={tenant.website} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={[tenant.addressLine1, tenant.addressLine2].filter(Boolean).join(', ') || undefined} />
                <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={[tenant.city, tenant.district, tenant.province].filter(Boolean).join(', ') || undefined} />
              </div>
            </div>

            {/* Verification / metadata */}
            <div className="section-glass space-y-4 md:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Verification & Metadata</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1"
                  onClick={() => tenant.isVerified ? unverify.mutate(id) : verify.mutate(id)}
                  disabled={verify.isPending || unverify.isPending}
                >
                  {tenant.isVerified ? <><ShieldX className="w-3.5 h-3.5" /> Revoke Verification</> : <><ShieldCheck className="w-3.5 h-3.5" /> Mark Verified</>}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
                <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Updated" value={new Date(tenant.updatedAt).toLocaleDateString()} />
                <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="ID" value={tenant.id} />
              </div>
              {tenant.notes && (
                <div className="pt-3 border-t border-white/10 dark:border-white/5">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Notes</div>
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">{tenant.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Owner Tab ── */}
        {tab === 'owner' && <OwnerTab tenantId={id} />}

        {/* ── Contacts Tab ── */}
        {tab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddContactOpen(true)} className="gap-2 rounded-xl glow-blue">
                <Plus className="w-4 h-4" /> Add Contact
              </Button>
            </div>
            {contacts.length === 0 ? (
              <EmptyState
                icon={Phone}
                title="No contacts"
                description="Add key contacts for this pharmacy"
                action={<Button onClick={() => setAddContactOpen(true)} className="gap-2 rounded-xl glow-blue"><Plus className="w-4 h-4" /> Add Contact</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((c) => (
                  <div key={c.id} className="section-glass hover-lift space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500/15 to-cyan-500/15 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{c.name}</div>
                          {c.designation && <div className="text-xs text-slate-400">{c.designation}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={contactTypeColors[c.contactType] ?? 'bg-slate-500/10 text-slate-400'}>
                          {c.contactType}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10"
                          onClick={() => deleteContact.mutate(c.id)}
                          disabled={deleteContact.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/10 dark:border-white/5">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Documents Tab ── */}
        {tab === 'documents' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAddDocumentOpen(true)} className="gap-2 rounded-xl glow-blue">
                <Plus className="w-4 h-4" /> Add Document
              </Button>
            </div>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents"
                description="Upload business registration, licenses, and certificates"
                action={<Button onClick={() => setAddDocumentOpen(true)} className="gap-2 rounded-xl glow-blue"><Plus className="w-4 h-4" /> Add Document</Button>}
              />
            ) : (
              <div className="space-y-3">
                {documents.map((d) => (
                  <div key={d.id} className="section-glass hover-lift flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500/15 to-orange-500/15 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{d.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <Badge className="bg-slate-500/10 text-slate-400 text-[10px]">{docTypeLabels[d.documentType] ?? d.documentType}</Badge>
                        {d.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires {new Date(d.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {d.fileUrl && (
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10 hover:text-blue-400">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteDocument.mutate(d.id)}
                        disabled={deleteDocument.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Branches Tab ── */}
        {tab === 'branches' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => router.push(`/tenants/${id}/branches/new`)} className="gap-2 rounded-xl glow-blue">
                <Plus className="w-4 h-4" />
                Add Branch
              </Button>
            </div>
            {branches.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No branches yet"
                description="Add the first branch location for this pharmacy"
                action={
                  <Button onClick={() => router.push(`/tenants/${id}/branches/new`)} className="gap-2 rounded-xl glow-blue">
                    <Plus className="w-4 h-4" />
                    Add Branch
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => (
                  <BranchCard key={branch.id} branch={branch} tenantId={id} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AddContactModal tenantId={id} open={addContactOpen} onClose={() => setAddContactOpen(false)} />
      <AddDocumentModal tenantId={id} open={addDocumentOpen} onClose={() => setAddDocumentOpen(false)} />
    </>
  );
}
