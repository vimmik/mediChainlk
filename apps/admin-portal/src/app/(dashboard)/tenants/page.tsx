'use client';

import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { TopProgressBar } from '@/components/shared/TopProgressBar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
    useDeactivateTenant,
    useReactivateTenant,
    useTenants,
    useUnverifyTenant,
    useVerifyTenant,
    type Tenant,
} from '@/hooks/useTenants';
import type { TenantQueryParams } from '@medichainlk/shared-types';
import {
    Badge,
    Button,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@medichainlk/ui';
import {
    Building2,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    MapPin,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Search,
    Settings,
    ShieldCheck,
    ShieldX,
    Users,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// ─── Constants ──────────────────────────────────────────────────────────────

const statusOptions = [
  { value: 'all', label: 'All status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
] as const;

const verifiedOptions = [
  { value: 'all', label: 'All verification' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
] as const;

const businessTypeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'pvt_ltd', label: 'Pvt Ltd' },
  { value: 'plc', label: 'PLC' },
] as const;

const planOptions = [
  { value: 'all', label: 'All plans' },
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
] as const;

const planColors: Record<string, string> = {
  free: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  basic: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const PAGE_SIZE = 10;

// ─── Row ────────────────────────────────────────────────────────────────────

function TenantRow({ tenant }: { tenant: Tenant }) {
  const deactivate = useDeactivateTenant();
  const reactivate = useReactivateTenant();
  const verify = useVerifyTenant();
  const unverify = useUnverifyTenant();

  return (
    <tr>
      {/* Pharmacy name & slug */}
      <td>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400">
            {tenant.name[0]?.toUpperCase() ?? 'T'}
          </div>
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{tenant.name}</div>
            <div className="text-xs text-slate-400 font-mono">/{tenant.slug}</div>
          </div>
        </div>
      </td>

      {/* City */}
      <td className="text-slate-500 dark:text-slate-400 text-xs">
        {tenant.city ?? '—'}
      </td>

      {/* Branches */}
      <td className="text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {tenant._count?.branches ?? 0}
        </div>
      </td>

      {/* Users */}
      <td className="text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {tenant._count?.users ?? 0}
        </div>
      </td>

      {/* Plan */}
      <td>
        {tenant.subscriptionPlan ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${planColors[tenant.subscriptionPlan] ?? planColors.free}`}>
            {tenant.subscriptionPlan}
          </span>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        )}
      </td>

      {/* Status */}
      <td>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${tenant.isActive ? 'status-dot-active' : 'status-dot-inactive'}`} />
          <span className={`text-xs font-medium ${tenant.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {tenant.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>

      {/* Verified */}
      <td>
        {tenant.isVerified ? (
          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">
            <XCircle className="w-3 h-3" /> Pending
          </Badge>
        )}
      </td>

      {/* Created */}
      <td className="text-slate-400 text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(tenant.createdAt).toLocaleDateString()}
        </div>
      </td>

      {/* Actions */}
      <td>
        <div className="flex items-center gap-1 justify-end">
          <Link href={`/tenants/${tenant.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10" title="View details">
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Link href={`/tenants/${tenant.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-violet-500/10 hover:text-violet-500" title="Edit tenant">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {/* Verify / Unverify */}
          {tenant.isVerified ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-orange-500/10 hover:text-orange-400"
              onClick={() => unverify.mutate(tenant.id)}
              disabled={unverify.isPending}
              title="Revoke verification"
            >
              <ShieldX className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
              onClick={() => verify.mutate(tenant.id)}
              disabled={verify.isPending}
              title="Verify tenant"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Activate / Deactivate */}
          {tenant.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-red-500/10 hover:text-destructive"
              onClick={() => deactivate.mutate(tenant.id)}
              disabled={deactivate.isPending}
              title="Deactivate"
            >
              <PowerOff className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
              onClick={() => reactivate.mutate(tenant.id)}
              disabled={reactivate.isPending}
              title="Reactivate"
            >
              <Power className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [isActive, setIsActive] = useState('all');
  const [isVerified, setIsVerified] = useState('all');
  const [businessType, setBusinessType] = useState('all');
  const [subscriptionPlan, setSubscriptionPlan] = useState('all');
  const [page, setPage] = useState(1);

  const params = useMemo<TenantQueryParams>(() => {
    const q: TenantQueryParams = { page, limit: PAGE_SIZE };
    if (debouncedSearch) q.search = debouncedSearch;
    if (isActive && isActive !== 'all') q.isActive = isActive === 'true';
    if (isVerified && isVerified !== 'all') q.isVerified = isVerified === 'true';
    if (businessType && businessType !== 'all') q.businessType = businessType as TenantQueryParams['businessType'];
    if (subscriptionPlan && subscriptionPlan !== 'all') q.subscriptionPlan = subscriptionPlan as TenantQueryParams['subscriptionPlan'];
    return q;
  }, [page, debouncedSearch, isActive, isVerified, businessType, subscriptionPlan]);

  const { data, isLoading, isFetching } = useTenants(params);

  const tenantList = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Reset to page 1 when filters change
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <TopProgressBar loading={isFetching && !isLoading} />

      <PageHeader
        title="Pharmacy Tenants"
        description={total > 0 ? `${total} registered pharmacies` : 'Manage pharmacy brands and their branch locations'}
        action={
          <Link href="/tenants/new">
            <Button className="gap-2 glow-blue rounded-xl">
              <Plus className="w-4 h-4" />
              New Tenant
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={Building2} variant="blue" delay={0} />
        <StatCard title="Active (page)" value={tenantList.filter((t) => t.isActive).length} icon={Power} variant="emerald" delay={1} />
        <StatCard title="Verified (page)" value={tenantList.filter((t) => t.isVerified).length} icon={ShieldCheck} variant="violet" delay={2} />
        <StatCard title="Enterprise (page)" value={tenantList.filter((t) => t.subscriptionPlan === 'enterprise').length} icon={CreditCard} variant="orange" delay={3} />
      </div>

      {/* Search & Filters */}
      <div className="section-glass rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              className="glass-input pl-9"
              placeholder="Search by name, slug, registration, email, city…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            <Select value={isActive} onValueChange={(v) => { setIsActive(v); resetPage(); }}>
              <SelectTrigger className="glass-input w-[140px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={isVerified} onValueChange={(v) => { setIsVerified(v); resetPage(); }}>
              <SelectTrigger className="glass-input w-[160px]">
                <SelectValue placeholder="All verification" />
              </SelectTrigger>
              <SelectContent>
                {verifiedOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={businessType} onValueChange={(v) => { setBusinessType(v); resetPage(); }}>
              <SelectTrigger className="glass-input w-[160px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {businessTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={subscriptionPlan} onValueChange={(v) => { setSubscriptionPlan(v); resetPage(); }}>
              <SelectTrigger className="glass-input w-[150px]">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                {planOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={9} />
      ) : tenantList.length === 0 ? (
        <div className="glass-table">
          <EmptyState
            icon={Building2}
            title="No tenants found"
            description={debouncedSearch || isActive || isVerified || businessType || subscriptionPlan
              ? 'Try adjusting your search or filters'
              : 'Create your first pharmacy tenant to get started'}
            action={
              !debouncedSearch && !isActive && !isVerified && !businessType && !subscriptionPlan ? (
                <Link href="/tenants/new">
                  <Button className="gap-2 rounded-xl glow-blue">
                    <Plus className="w-4 h-4" /> Create Tenant
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="glass-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Pharmacy</th>
                <th className="text-left">City</th>
                <th className="text-left">Branches</th>
                <th className="text-left">Users</th>
                <th className="text-left">Plan</th>
                <th className="text-left">Status</th>
                <th className="text-left">Verified</th>
                <th className="text-left">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenantList.map((t) => <TenantRow key={t.id} tenant={t} />)}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages} &middot; {total} total
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
