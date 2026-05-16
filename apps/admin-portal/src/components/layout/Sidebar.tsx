'use client';

import { useMyMenu, type MenuChildNode, type MenuParentNode } from '@/hooks/useMenu';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@medichainlk/ui';
import { signOut } from 'firebase/auth';
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Pill,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// Map the icon-name strings stored in the DB to lucide components.
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  ShieldCheck,
  Package,
  Pill,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Activity,
};

function iconFor(name: string | null): React.ComponentType<{ className?: string }> {
  return (name && ICON_MAP[name]) || MenuIcon;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, reset, tenantId } = useAuthStore();
  const { data: menu = [], isLoading } = useMyMenu();

  // ─── Expansion state ──────────────────────────────────────────────────────
  // Parents and children are collapsible. We track expanded ids by key.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Determine which parent/child contains the active route so we can auto-open it.
  const activeBranch = useMemo(() => {
    for (const parent of menu) {
      for (const child of parent.children) {
        for (const screen of child.screens) {
          if (
            screen.route &&
            (pathname === screen.route || pathname.startsWith(screen.route + '/'))
          ) {
            return { parentId: parent.id, childId: child.id };
          }
        }
      }
    }
    return null;
  }, [menu, pathname]);

  // Auto-expand the branch holding the active route whenever it changes.
  useEffect(() => {
    if (!activeBranch) return;
    setExpanded((prev) => ({
      ...prev,
      [activeBranch.parentId]: true,
      [activeBranch.childId]: true,
    }));
  }, [activeBranch]);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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

  const isScreenActive = (route: string | null) =>
    !!route && (pathname === route || pathname.startsWith(route + '/'));

  // ─── Render a single child group (sub-menu + its screens) ─────────────────
  const renderChild = (child: MenuChildNode) => {
    const ChildIcon = iconFor(child.icon);
    const childHasActive = child.screens.some((s) => isScreenActive(s.route));
    // A child is open if explicitly toggled, or if it contains the active route.
    const open = expanded[child.id] ?? childHasActive;

    return (
      <div key={child.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggle(child.id)}
          className={cn(
            'w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-lg text-[13px] font-medium transition-colors',
            childHasActive
              ? 'text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          )}
        >
          <ChildIcon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left truncate">{child.label}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 shrink-0 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>

        {open && (
          <div className="ml-4 pl-3 border-l border-white/10 dark:border-white/5 space-y-0.5">
            {child.screens.map((screen) => {
              const active = isScreenActive(screen.route);
              return (
                <Link
                  key={screen.id}
                  href={screen.route ?? '#'}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all',
                    active
                      ? 'nav-active text-blue-400 font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/5',
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                      active ? 'bg-blue-400' : 'bg-slate-500/40',
                    )}
                  />
                  <span className="flex-1 truncate">{screen.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Render a parent group ────────────────────────────────────────────────
  const renderParent = (parent: MenuParentNode) => {
    const ParentIcon = iconFor(parent.icon);
    const parentHasActive = parent.children.some((c) =>
      c.screens.some((s) => isScreenActive(s.route)),
    );
    const open = expanded[parent.id] ?? parentHasActive;

    return (
      <div key={parent.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggle(parent.id)}
          className={cn(
            'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
            parentHasActive
              ? 'text-blue-400'
              : 'text-slate-600 dark:text-slate-300',
          )}
        >
          <ParentIcon
            className={cn(
              'w-4.5 h-4.5 shrink-0 transition-colors',
              parentHasActive ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500',
            )}
          />
          <span className="flex-1 text-left">{parent.label}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 shrink-0 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>

        {open && (
          <div className="mt-0.5 space-y-0.5">
            {parent.children.map((child) => renderChild(child))}
          </div>
        )}
      </div>
    );
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

      {/* Nav tree */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {isLoading ? (
          // Lightweight skeleton while /me/menu resolves
          <div className="space-y-2 px-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-xl bg-white/5 dark:bg-white/[0.03] animate-pulse"
              />
            ))}
          </div>
        ) : menu.length === 0 ? (
          <p className="px-3 py-4 text-xs text-slate-400">
            No accessible menu items. Contact your administrator.
          </p>
        ) : (
          menu.map((parent) => renderParent(parent))
        )}
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
