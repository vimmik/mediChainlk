'use client';

import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { NavigationProgress } from '@/components/shared/NavigationProgress';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

function AuthBootstrap() {
  useAuth();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationProgress />
        <AuthBootstrap />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(79,142,248,0.20)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#0f172a' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
