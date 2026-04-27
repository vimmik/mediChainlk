'use client';

import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback } from '@medichainlk/ui';
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, role } = useAuthStore();
  const { theme, toggle } = useTheme();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'AD';
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Admin';

  return (
    <header className="glass-topbar h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left — hamburger (mobile) + search */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl glass-card min-w-50 lg:min-w-70">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="text-sm bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-full"
          />
        </div>
      </div>

      {/* Right — notifications + theme + avatar */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors theme-switch"
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun className="w-4.5 h-4.5" />
            : <Moon className="w-4.5 h-4.5" />
          }
        </button>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {/* Pulse badge */}
          <span className="badge-pulse absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-background" />
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{displayName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight capitalize">
              {role?.replace(/_/g, ' ')}
            </p>
          </div>
          <Avatar className="h-8 w-8 glow-ring rounded-xl">
            <AvatarFallback className="text-xs font-bold rounded-xl badge-blue text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
