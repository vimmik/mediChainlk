'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TopProgressBar } from '@/components/shared/TopProgressBar';
import { useIsFetching } from '@tanstack/react-query';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isFetching = useIsFetching();

  return (
    <div className="flex min-h-screen mesh-bg">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopProgressBar loading={isFetching > 0} />
        <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

