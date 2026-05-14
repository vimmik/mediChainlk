'use client';

import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@medichainlk/ui';
import { signOut } from 'firebase/auth';
import {
  Activity,
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  permission: string | null;
  icon: React.ComponentType<{ className?: string }>;
}

const SYSTEM_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',   permission: 'DASHBOARD_VIEW',  icon: LayoutDashboard },
  { href: '/tenants',     label: 'Pharmacies',  permission: 'PHARMACY_MANAGE', icon: Building2 },
  { href: '/users',       label: 'Users',       permission: 'USER_MANAGE',     icon: Users },
  { href: '/roles',       label: 'Roles',       permission: 'ROLE_MANAGE',     icon: Shield },
  { href: '/permissions', label: 'Permissions', permission: 'USER_MANAGE',     icon: ShieldCheck },
  { href: '/monitoring',  label: 'Monitoring',  permission: null,              icon: Activity },
];

const PHARMACY_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',   permission: 'DASHBOARD_VIEW',  icon: LayoutDashboard },
  { href: '/users',        label: 'Staff',       permission: 'USER_MANAGE',     icon: Users },
  { href: '/roles',        label: 'Roles',       permission: 'ROLE_MANAGE',     icon: Shield },
  { href: '/inventory',    label: 'Inventory',   permission: 'INVENTORY_VIEW',  icon: Package },
  { href: '/orders',       label: 'Orders',      permission: 'ORDER_VIEW',      icon: ShoppingCart },
  { href: '/prescriptions',label: 'Prescriptions',permission: 'PRESCRIPTION_VIEW', icon: ClipboardList },
  { href: '/reports',      label: 'Reports',     permission: 'REPORTS_VIEW',    icon: BarChart3 },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, permissions, reset, tenantId } = useAuthStore();

  const navItems = role === 'pharmacy_admin' ? PHARMACY_ADMIN_NAV : SYSTEM_ADMIN_NAV;

  // While auth is loading (permissions still empty), show all nav items so
  // the sidebar is immediately interactive. Once permissions resolve, filter.
  const visibleItems =
    permissions.length === 0
      ? navItems
      : navItems.filter(
          (item) => item.permission === null || permissions.includes(item.permission),
        );

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      /* backend unreachable — cookie expires naturally */
    }
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    reset();
    router.replace('/login');
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-7 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl badge-blue flex items-center justify-center shadow-lg shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-extrabold gradient-text leading-tight">MediChainLK</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
            Admin Portal
          </p>
        </div>
      </div>

      <div className="mx-4 h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-3" />

      {/* Tenant badge (pharmacy_admin only) */}
      {role === 'pharmacy_admin' && tenantId && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl glass-card text-[10px] text-slate-400 font-mono truncate">
          {tenantId}
        </div>
      )}

      {/* Nav section label */}
      <p className="px-6 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        Navigation
      </p>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'nav-active text-blue-400'
                  : 'text-slate-600 dark:text-slate-300',
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 shrink-0 transition-colors',
                  isActive ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500',
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mt-auto space-y-1">
        <div className="mx-1 h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-3" />

        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-lg badge-blue flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white uppercase">
              {role?.charAt(0) ?? 'A'}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
            {role?.replace(/_/g, ' ')}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-col glass-sidebar sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col glass-sidebar lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
