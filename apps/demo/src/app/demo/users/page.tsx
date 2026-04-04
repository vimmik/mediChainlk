'use client';

import { USERS } from '@/lib/mock-data';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Users, Phone } from 'lucide-react';

const ROLE_BADGE: Record<string, 'blue' | 'purple' | 'green'> = {
  pharmacy_owner: 'purple',
  pharmacy_staff: 'blue',
  customer: 'green',
};

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        sub="All registered users across the platform"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Users className="w-4 h-4" /> Invite User
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pharmacy</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {USERS.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge label={u.role.replace('_', ' ')} variant={ROLE_BADGE[u.role] ?? 'gray'} />
                </td>
                <td className="px-5 py-3.5 text-slate-600">{u.pharmacy ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3 h-3" /> {u.phone}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500">{u.joined}</td>
                <td className="px-5 py-3.5">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
