'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { cn } from '@medichainlk/ui';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  href: string;
  label: string;
  permission: string | null; // null = always visible
}

const SYSTEM_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',   permission: 'DASHBOARD_VIEW' },
  { href: '/tenants',     label: 'Pharmacies',  permission: 'PHARMACY_MANAGE' },
  { href: '/users',       label: 'Users',       permission: 'USER_MANAGE' },
  { href: '/permissions', label: 'Permissions', permission: 'USER_MANAGE' },
  { href: '/monitoring',  label: 'Monitoring',  permission: null },
];

const PHARMACY_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',   permission: 'DASHBOARD_VIEW' },
  { href: '/users',       label: 'Staff',       permission: 'USER_MANAGE' },
  { href: '/inventory',   label: 'Inventory',   permission: 'INVENTORY_VIEW' },
  { href: '/orders',      label: 'Orders',      permission: 'ORDER_VIEW' },
  { href: '/reports',     label: 'Reports',     permission: 'REPORTS_VIEW' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, permissions, reset, tenantId } = useAuthStore();

  const navItems = role === 'pharmacy_admin' ? PHARMACY_ADMIN_NAV : SYSTEM_ADMIN_NAV;

  const visibleItems = navItems.filter(
    (item) => item.permission === null || permissions.includes(item.permission),
  );

  const handleLogout = async () => {
    // 1. Destroy the server-side session FIRST. This clears the HttpOnly cookie
    //    (which JS cannot touch) and removes the session from Redis so any
    //    other tabs/devices lose access immediately.
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      /* backend unreachable — cookie will still expire naturally */
    }

    // 2. Sign out of Firebase client SDK so the local token cache is cleared.
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);

    // 3. Reset the in-memory auth store.
    reset();

    // 4. Hard navigate so middleware re-runs with the cleared cookie state.
    router.replace('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">MediChainLK</h1>
        <p className="text-xs text-gray-400 mt-1">
          {role === 'pharmacy_admin' ? 'Pharmacy Portal' : 'Admin Portal'}
        </p>
        {role === 'pharmacy_admin' && tenantId && (
          <p className="text-xs text-gray-500 mt-0.5 font-mono truncate" title={tenantId}>
            {tenantId}
          </p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-1">
        <div className="px-3 py-1 text-xs text-gray-500 capitalize">
          {role?.replace(/_/g, ' ')}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
