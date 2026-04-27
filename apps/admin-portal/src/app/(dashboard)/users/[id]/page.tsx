'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@medichainlk/ui';
import { useUser } from '@/hooks/useUsers';
import { EditUserDrawer } from '@/components/users/EditUserDrawer';
import { Pencil, MapPin, Building2, Star } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DetailSkeleton } from '@/components/shared/TableSkeleton';

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  system_admin:   { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',   label: 'System Admin' },
  pharmacy_admin: { bg: 'bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400', label: 'Pharmacy Admin' },
  pharmacy_staff: { bg: 'bg-teal-500/10',    text: 'text-teal-600 dark:text-teal-400',   label: 'Pharmacy Staff' },
  customer:       { bg: 'bg-slate-500/10',   text: 'text-slate-600 dark:text-slate-400', label: 'Customer' },
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-slate-700 dark:text-slate-300 font-medium">
        {value ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
      </dd>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton sections={4} fieldsPerSection={6} />;
  }

  if (!user) {
    return (
      <div className="section-glass text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">User not found.</p>
        <Link href="/users" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
          Back to users
        </Link>
      </div>
    );
  }

  const roleCfg = ROLE_COLORS[user.role] ?? { bg: 'bg-slate-500/10', text: 'text-slate-500', label: user.role };
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User';
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        <PageHeader
          title={displayName}
          breadcrumbs={[{ label: 'Users', href: '/users' }, { label: displayName }]}
          badge={
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleCfg.bg} ${roleCfg.text}`}>
                {roleCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
              }`}>
                <span className={`status-dot ${user.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          }
          action={
            <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2 rounded-xl">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          }
        />

        {/* Avatar header */}
        <div className="section-glass flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
            {initials}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">{displayName}</div>
            <div className="text-sm text-slate-400 dark:text-slate-500">{user.email}</div>
            {user.phone && <div className="text-sm text-slate-400 dark:text-slate-500">{user.phone}</div>}
          </div>
        </div>

        {/* Personal Information */}
        <div className="section-glass space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Personal Information</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="First name" value={user.firstName} />
            <Field label="Last name" value={user.lastName} />
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone} />
            <Field label="NIC" value={user.nic} />
            <Field label="Gender" value={user.gender} />
            <Field label="Date of birth" value={user.birthday ? new Date(user.birthday).toLocaleDateString() : null} />
            <Field label="Height" value={user.height ? `${user.height} cm` : null} />
            <Field label="Weight" value={user.weight ? `${user.weight} kg` : null} />
          </dl>
        </div>

        {/* Address */}
        <div className="section-glass space-y-5">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            Address
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Address line 1" value={user.addressLine1} />
            <Field label="Address line 2" value={user.addressLine2} />
            <Field label="Address line 3" value={user.addressLine3} />
            <Field label="District" value={user.district} />
            <Field label="Postal code" value={user.postalCode} />
          </dl>
        </div>

        {/* Account */}
        <div className="section-glass space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Account</h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Role" value={roleCfg.label} />
            <Field label="Tenant" value={(user as { tenant?: { name?: string } }).tenant?.name} />
            <Field label="Firebase UID" value={user.firebaseUid} />
            <Field label="Created" value={new Date(user.createdAt).toLocaleString()} />
            <Field label="Last updated" value={new Date(user.updatedAt).toLocaleString()} />
          </dl>
        </div>

        {/* Branch Assignments */}
        {(user as { branchAssignments?: { id: string; isPrimary: boolean; branch: { id: string; name: string; city: string } }[] }).branchAssignments?.length ? (
          <div className="section-glass space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Building2 className="w-3.5 h-3.5" />
              Branch Assignments
            </h3>
            <div className="space-y-2">
              {(user as { branchAssignments: { id: string; isPrimary: boolean; branch: { id: string; name: string; city: string } }[] }).branchAssignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-white/5 dark:bg-white/[0.03] border border-white/10 dark:border-white/5 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-violet-500/70" />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{a.branch.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.branch.city}</span>
                    {a.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                        <Star className="w-2.5 h-2.5" />
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <EditUserDrawer user={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
