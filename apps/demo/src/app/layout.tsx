import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIMMIK || MediChainLK — Demo',
  description: 'AI-powered pharmacy management platform demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
