'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@medichainlk/ui';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/prescriptions', label: 'Prescriptions' },
  { href: '/orders', label: 'Orders' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/reports', label: 'Reports' },
];

export function PharmacySidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-green-900 text-white flex flex-col">
      <div className="p-6 border-b border-green-700">
        <h1 className="text-xl font-bold">MediChainLK</h1>
        <p className="text-xs text-green-300 mt-1">Pharmacy Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-700 hover:text-white',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
