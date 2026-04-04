'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDemoStore, type Role, NOTIFICATIONS } from '@/store/demo-store';
import { PRESCRIPTIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Users, FileText, Package,
  ShoppingCart, Cpu, Smartphone, ChevronRight, RefreshCw,
  Bell, Sun, Moon, BarChart2, Receipt,
} from 'lucide-react';

const NAV = [
  { href: '/demo/dashboard',    label: 'Dashboard',     icon: LayoutDashboard, roles: ['system_admin', 'pharmacy_staff', 'customer'] },
  { href: '/demo/analytics',    label: 'Analytics',     icon: BarChart2,       roles: ['system_admin', 'pharmacy_staff'] },
  { href: '/demo/pharmacies',   label: 'Pharmacies',    icon: Building2,       roles: ['system_admin'] },
  { href: '/demo/users',        label: 'Users',         icon: Users,           roles: ['system_admin'] },
  { href: '/demo/prescriptions', label: 'Prescriptions', icon: FileText,       roles: ['pharmacy_staff'] },
  { href: '/demo/ai-pipeline',  label: 'AI Pipeline',   icon: Cpu,             roles: ['pharmacy_staff', 'system_admin'] },
  { href: '/demo/inventory',    label: 'Inventory',     icon: Package,         roles: ['pharmacy_staff'] },
  { href: '/demo/orders',       label: 'Orders',        icon: ShoppingCart,    roles: ['pharmacy_staff'] },
  { href: '/demo/billing',      label: 'Billing',       icon: Receipt,         roles: ['pharmacy_staff'] },
  { href: '/demo/customer',     label: 'Customer App',  icon: Smartphone,      roles: ['customer', 'pharmacy_staff', 'system_admin'] },
];

const ROLE_CONFIG: Record<Role, { label: string; color: string; badge: string }> = {
  system_admin:   { label: 'System Admin',   color: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700' },
  pharmacy_staff: { label: 'Pharmacy Staff', color: 'bg-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  customer:       { label: 'Customer',       color: 'bg-green-600',  badge: 'bg-green-100 text-green-700' },
};

const DOT_COLOR: Record<string, string> = {
  red:   'bg-red-500',
  blue:  'bg-blue-500',
  green: 'bg-green-500',
  gray:  'bg-slate-400',
};

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeRole, setRole, theme, setTheme, notificationsRead, setNotificationsRead } = useDemoStore();
  const cfg = ROLE_CONFIG[activeRole];
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const pendingRx = PRESCRIPTIONS.filter((rx) => rx.status === 'PENDING_REVIEW').length;
  const visibleNav = NAV.filter((n) => n.roles.includes(activeRole));

  // Apply dark class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  // Close notifications on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notificationsRead ? 0 : NOTIFICATIONS.length;

  return (
    <div className={cn('flex h-screen overflow-hidden', theme === 'dark' ? 'bg-[#0f1629]' : 'bg-slate-50')}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col flex-shrink-0 text-white"
        style={{ backgroundColor: 'var(--sidebar)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}>
              M
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight">MediChainLK</div>
              <div className="text-xs text-slate-400 font-medium">Platform Demo</div>
            </div>
          </div>
        </div>

        {/* Role switcher */}
        <div className="px-4 py-3 border-b border-slate-700/60">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">View as</p>
          <div className="space-y-1">
            {(['system_admin', 'pharmacy_staff', 'customer'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => setRole(role)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all',
                  activeRole === role
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white',
                )}
                style={activeRole !== role ? { ':hover': { backgroundColor: 'var(--sidebar-hover)' } } as React.CSSProperties : {}}
                onMouseEnter={(e) => { if (activeRole !== role) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; }}
                onMouseLeave={(e) => { if (activeRole !== role) e.currentTarget.style.backgroundColor = ''; }}
              >
                <span>{ROLE_CONFIG[role].label}</span>
                {activeRole === role && <ChevronRight className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            const isPrescriptions = href === '/demo/prescriptions';
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white',
                )}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
              >
                {/* Active accent bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-300 rounded-r-full" />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {/* Pending pulse dot for Prescriptions */}
                {isPrescriptions && pendingRx > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                    </span>
                    <span className={cn('text-xs font-bold', isActive ? 'text-amber-200' : 'text-amber-400')}>
                      {pendingRx}
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Platform Status */}
        <div className="px-4 py-3 border-t border-slate-700/60">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Platform Status</p>
          <div className="space-y-1.5">
            {[
              { label: 'API', status: 'Online' },
              { label: 'AI Service', status: 'Online' },
              { label: 'Database', status: 'Online' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="px-4 py-3 border-t border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full animate-pulse', cfg.color)} />
            <span className="text-xs text-slate-400">Demo Mode — localStorage</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={cn(
          'h-14 border-b flex items-center justify-between px-6 flex-shrink-0 shadow-sm',
          theme === 'dark' ? 'bg-[#1a2236] border-slate-700/60' : 'bg-white border-slate-200',
        )}>
          <div className="flex items-center gap-3">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', cfg.badge)}>
              {cfg.label}
            </span>
            <span className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
              Colombo Central Pharmacy
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Reset */}
            <button
              onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('medichainlk-demo'); window.location.reload(); } }}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2 py-1 rounded hover:bg-slate-100 transition-colors',
                theme === 'dark' ? 'text-slate-400 hover:bg-slate-700/60' : 'text-slate-500 hover:bg-slate-100',
              )}
              title="Reset all demo data"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                theme === 'dark'
                  ? 'bg-slate-700 text-amber-400 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors relative',
                  theme === 'dark'
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className={cn(
                  'absolute right-0 top-10 w-80 rounded-xl border shadow-xl z-50 animate-float-in',
                  theme === 'dark'
                    ? 'bg-[#1a2236] border-slate-700/60'
                    : 'bg-white border-slate-200',
                )}>
                  <div className={cn('flex items-center justify-between px-4 py-3 border-b', theme === 'dark' ? 'border-slate-700/60' : 'border-slate-100')}>
                    <span className={cn('text-sm font-semibold', theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}>
                      Notifications
                    </span>
                    <button
                      onClick={() => { setNotificationsRead(true); setNotifOpen(false); }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-colors',
                          theme === 'dark' ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50',
                        )}
                      >
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', DOT_COLOR[n.dot])} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs leading-snug', theme === 'dark' ? 'text-slate-200' : 'text-slate-700')}>{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {activeRole === 'system_admin' ? 'SA' : activeRole === 'pharmacy_staff' ? 'PS' : 'CU'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={cn('flex-1 overflow-y-auto p-6 animate-slide-in', theme === 'dark' ? 'bg-[#0f1629]' : 'bg-slate-50')}>
          {children}
        </main>
      </div>
    </div>
  );
}
