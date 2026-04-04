import { DemoShell } from '@/components/layout/DemoShell';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
