'use client';

import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DISEASE_DETAILS, DISEASE_USER_MAP, USERS } from '@/lib/mock-data';
import { ChevronDown, ChevronUp, Heart, IdCard, MapPin, Phone, Shield, Users } from 'lucide-react';
import { useState } from 'react';

const ROLE_BADGE: Record<string, 'blue' | 'purple' | 'green' | 'red'> = {
  system_admin: 'red',
  pharmacy_owner: 'purple',
  pharmacy_staff: 'blue',
  customer: 'green',
};

function getUserDiseases(userId: string) {
  return DISEASE_USER_MAP
    .filter((d) => d.userId === userId)
    .map((d) => {
      const disease = DISEASE_DETAILS.find((dd) => dd.id === d.diseaseId);
      return { ...d, diseaseName: disease?.name ?? '', diseaseCode: disease?.code ?? '' };
    });
}

export default function UsersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const staffCount = USERS.filter(u => u.role === 'pharmacy_staff' || u.role === 'pharmacy_owner').length;
  const customerCount = USERS.filter(u => u.role === 'customer').length;
  const withConditions = new Set(DISEASE_USER_MAP.map(d => d.userId)).size;

  const filtered = roleFilter === 'all' ? USERS : USERS.filter(u => u.role === roleFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        sub="All registered users across the platform"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Users className="w-4 h-4" /> Invite User
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={USERS.length} sub="All platform users" icon={Users} color="blue" />
        <StatCard title="Pharmacy Staff" value={staffCount} sub="Owners + staff" icon={Shield} color="purple" />
        <StatCard title="Customers" value={customerCount} sub="Registered patients" icon={Heart} color="green" />
        <StatCard title="With Health Conditions" value={withConditions} sub="Patients with disease records" icon={Heart} color="red" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['all', 'system_admin', 'pharmacy_owner', 'pharmacy_staff', 'customer'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${roleFilter === r ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            {r === 'all' ? 'All' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">NIC</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">District</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Pharmacy</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const diseases = getUserDiseases(u.id);
              const isExpanded = expandedId === u.id;
              return (
                <>
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{u.name}</span>
                          <span className="block text-[10px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={u.role.replace(/_/g, ' ')} variant={ROLE_BADGE[u.role] ?? 'gray'} />
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs font-mono text-slate-600">{u.nic}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-600 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {u.district}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                        <Phone className="w-3 h-3" /> {u.phone}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-600 text-xs">{u.pharmacy ?? '—'}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 text-xs">{u.joined}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : u.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${u.id}-detail`}>
                      <td colSpan={8} className="bg-slate-50/80 px-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {/* Personal Info */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <IdCard className="w-3.5 h-3.5" /> Personal Info
                            </h4>
                            <div className="space-y-1 text-xs text-slate-700">
                              <p><span className="text-slate-400">Gender:</span> {u.gender}</p>
                              <p><span className="text-slate-400">Birthday:</span> {u.birthDay}</p>
                              <p><span className="text-slate-400">NIC:</span> {u.nic}</p>
                              {'height' in u && <p><span className="text-slate-400">Height/Weight:</span> {u.height}cm / {u.weight}kg</p>}
                            </div>
                          </div>
                          {/* Address */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> Address
                            </h4>
                            <div className="space-y-1 text-xs text-slate-700">
                              <p>{u.addressLine1}</p>
                              {u.addressLine2 && <p>{u.addressLine2}</p>}
                              <p>{u.district}, {u.postalCode}</p>
                            </div>
                          </div>
                          {/* Health Profile */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" /> Health Profile
                            </h4>
                            {diseases.length > 0 ? (
                              <div className="space-y-1.5">
                                {diseases.map((d) => (
                                  <div key={d.id} className="flex items-start gap-2">
                                    <Badge label={d.diseaseCode} variant="red" />
                                    <div className="text-xs">
                                      <p className="font-medium text-slate-700">{d.diseaseName}</p>
                                      <p className="text-slate-400">{d.notes}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">No health conditions recorded</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
