'use client';

import { PRESCRIPTIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { NOTIFICATIONS, useDemoStore, type Role } from '@/store/demo-store';
import {
    BarChart2,
    Bell,
    Building2,
    ChevronRight,
    Cpu,
    FileText,
    LayoutDashboard,
    MapPin,
    Moon,
    Package,
    Pill,
    Receipt,
    RefreshCw,
    Shield,
    ShoppingCart,
    Smartphone,
    Sun,
    Truck,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  { href: '/demo/medicines',    label: 'Medicines',     icon: Pill,            roles: ['pharmacy_staff', 'system_admin'] },
  { href: '/demo/supply-chain', label: 'Supply Chain',  icon: Truck,           roles: ['pharmacy_staff'] },
  { href: '/demo/permissions',  label: 'Permissions',   icon: Shield,          roles: ['system_admin'] },
  { href: '/demo/delivery',     label: 'Delivery',      icon: MapPin,          roles: ['pharmacy_staff'] },
  { href: '/demo/customer',     label: 'Customer App',  icon: Smartphone,      roles: ['customer', 'pharmacy_staff', 'system_admin'] },
];

const ROLE_CONFIG: Record<Role, { label: string; color: string; badge: string; dot: string }> = {
  system_admin:   { label: 'System Admin',   color: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  pharmacy_staff: { label: 'Pharmacy Staff', color: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400'   },
  customer:       { label: 'Customer',       color: 'bg-emerald-500', badge: 'bg-green-100 text-green-700',  dot: 'bg-emerald-400'},
};

const DOT_COLOR: Record<string, string> = {
  red:   'bg-red-400',
  blue:  'bg-blue-400',
  green: 'bg-emerald-400',
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
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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
    <div className={cn('flex h-screen overflow-hidden', isDark ? 'bg-[#0d1523]' : 'bg-slate-100')}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="w-[220px] flex flex-col flex-shrink-0 text-white border-r"
        style={{
          backgroundColor: 'var(--sidebar)',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
            >
              M
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[13px] tracking-tight text-white leading-tight">MediChainLK</div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Pharmacy Platform</div>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-semibold px-1">View as</p>
          <div className="space-y-0.5">
            {(['system_admin', 'pharmacy_staff', 'customer'] as Role[]).map((role) => {
              const isActive = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setRole(role)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white',
                  )}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', ROLE_CONFIG[role].dot)} />
                    {ROLE_CONFIG[role].label}
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            const isPrescriptions = href === '/demo/prescriptions';
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white',
                )}
                style={isActive ? {
                  background: 'linear-gradient(90deg, rgba(37,99,235,0.9) 0%, rgba(37,99,235,0.6) 100%)',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                } : {}}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-r-full shadow-sm" />
                )}
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
                <span className="flex-1 truncate">{label}</span>
                {isPrescriptions && pendingRx > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                    </span>
                    <span className={cn('text-[10px] font-bold', isActive ? 'text-amber-200' : 'text-amber-400')}>
                      {pendingRx}
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Platform Status */}
        <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-semibold px-1">Platform</p>
          <div className="space-y-1">
            {[
              { label: 'API Server',  ok: true },
              { label: 'AI Service',  ok: true },
              { label: 'Database',    ok: true },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between px-1">
                <span className="text-[11px] text-slate-500">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full', ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
                  <span className={cn('text-[10px] font-semibold', ok ? 'text-emerald-400' : 'text-red-400')}>
                    {ok ? 'Online' : 'Down'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Tag */}
        <div className="px-3 pb-3">
          <div
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0', cfg.dot)} />
            <span className="text-[10px] text-slate-500 font-medium truncate">Demo · localStorage</span>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="h-14 border-b flex items-center justify-between px-5 flex-shrink-0"
          style={{
            backgroundColor: isDark ? '#14202e' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0',
            boxShadow: isDark
              ? '0 1px 0 rgba(255,255,255,0.04)'
              : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          {/* Left: role + context */}
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide flex-shrink-0', cfg.badge)}>
              {cfg.label}
            </span>
            <span className="text-sm text-slate-400 truncate hidden sm:block">
              Colombo Central Pharmacy
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Reset */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('medichainlk-demo');
                  window.location.reload();
                }
              }}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all',
                isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/06'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
              )}
              title="Reset demo data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                isDark
                  ? 'bg-white/08 text-amber-400 hover:bg-white/12'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              style={isDark ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all relative',
                  isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
                style={isDark ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 top-11 w-80 rounded-2xl border z-50 animate-float-in overflow-hidden"
                  style={{
                    backgroundColor: isDark ? '#14202e' : '#ffffff',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                    boxShadow: isDark
                      ? '0 20px 50px rgba(0,0,0,0.6)'
                      : '0 10px 30px rgba(0,0,0,0.12)',
                  }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9' }}
                  >
                    <span className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-800')}>
                      Notifications
                    </span>
                    {!notificationsRead && (
                      <button
                        onClick={() => { setNotificationsRead(true); setNotifOpen(false); }}
                        className="text-xs text-blue-500 hover:text-blue-400 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }}>
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 cursor-default"
                        style={{ transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                      >
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', DOT_COLOR[n.dot])} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs leading-snug', isDark ? 'text-slate-300' : 'text-slate-700')}>{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 cursor-default"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
              title={cfg.label}
            >
              {activeRole === 'system_admin' ? 'SA' : activeRole === 'pharmacy_staff' ? 'PS' : 'CU'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto animate-slide-in"
          style={{ backgroundColor: isDark ? '#0d1523' : '#f1f5f9' }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

