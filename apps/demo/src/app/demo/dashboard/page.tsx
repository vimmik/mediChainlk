'use client';

import { useDemoStore } from '@/store/demo-store';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PHARMACIES, ORDERS, PRESCRIPTIONS, REVENUE_CHART, ORDERS_CHART, RECENT_ACTIVITY, QUICK_REORDER } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, FileText, ShoppingCart, TrendingUp, Users, AlertTriangle,
  CheckCircle, Clock, Plus, Download, FileSearch, Settings, Zap,
  Star, Timer, Activity, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeRole } = useDemoStore();

  if (activeRole === 'system_admin') return <AdminDashboard />;
  if (activeRole === 'customer') return <CustomerDashboard />;
  return <PharmacyDashboard />;
}

function AdminDashboard() {
  const totalRevenue = PHARMACIES.reduce((s, p) => s + p.revenue, 0);
  const totalOrders  = PHARMACIES.reduce((s, p) => s + p.orders, 0);

  const quickActions = [
    { label: 'Add Pharmacy', icon: Plus, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Export Report', icon: Download, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'View Logs', icon: FileSearch, color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'System Settings', icon: Settings, color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="System Overview" sub="All pharmacies · April 2026" />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md ${color}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Pharmacies" value={PHARMACIES.filter(p => p.isActive).length} sub={`${PHARMACIES.length} total`} icon={Building2} color="blue" trend={{ value: '+1 this month', up: true }} />
        <StatCard title="Total Orders"       value={totalOrders}    sub="This month"           icon={ShoppingCart} color="green" trend={{ value: '+18% vs last', up: true }} />
        <StatCard title="Platform Revenue"   value={formatCurrency(totalRevenue)} sub="This month" icon={TrendingUp} color="purple" trend={{ value: '+9.5%', up: true }} />
        <StatCard title="Registered Users"   value="1,247"          sub="+34 this week"        icon={Users} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Platform Revenue (LKR)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REVENUE_CHART}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`LKR ${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Pharmacy Performance</h3>
          <div className="space-y-3">
            {PHARMACIES.filter(p => p.isActive).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-32 text-xs text-slate-600 truncate">{p.name.split(' ').slice(0, 2).join(' ')}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((p.revenue / 500000) * 100)}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-slate-700 w-20 text-right">{formatCurrency(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          <span className="text-xs text-slate-400">Live feed</span>
        </div>
        <div className="space-y-3">
          {RECENT_ACTIVITY.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <span className="text-lg leading-none mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{item.text}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PharmacyDashboard() {
  const pendingRx = PRESCRIPTIONS.filter(rx => rx.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Today's Summary" sub="Colombo Central Pharmacy · April 4, 2026" />

      {/* Urgent Actions Banner */}
      {pendingRx > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {pendingRx} prescription{pendingRx > 1 ? 's' : ''} awaiting pharmacist review
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Review required before dispensing</p>
            </div>
          </div>
          <Link
            href="/demo/prescriptions"
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Today's Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg Fill Time', value: '8 min', icon: Timer, color: 'text-blue-600 bg-blue-50' },
          { label: 'Customer Satisfaction', value: '4.8 ★', icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'AI Accuracy', value: '94%', icon: Activity, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Prescriptions to Review" value={pendingRx} sub="Awaiting pharmacist" icon={FileText} color="amber" />
        <StatCard title="Orders Today"     value={ORDERS.length}  sub="2 out for delivery"   icon={ShoppingCart} color="blue" trend={{ value: '+5 vs yesterday', up: true }} />
        <StatCard title="Revenue Today"    value="LKR 9,420"      sub="5 completed orders"   icon={TrendingUp} color="green" trend={{ value: '+12%', up: true }} />
        <StatCard title="Low Stock Alerts" value="3"              sub="Items need reorder"   icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Orders This Week</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ORDERS_CHART} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Prescription Queue</h3>
          <div className="space-y-3">
            {PRESCRIPTIONS.slice(0, 3).map((rx) => (
              <div key={rx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rx.confidenceTier === 'HIGH' ? 'bg-green-500' : rx.confidenceTier === 'MEDIUM' ? 'bg-amber-400' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{rx.patient}</p>
                  <p className="text-xs text-slate-400">{rx.medicines.length} medicines</p>
                </div>
                <span className={`text-xs font-semibold ${rx.confidenceTier === 'HIGH' ? 'text-green-600' : rx.confidenceTier === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'}`}>
                  {Math.round(rx.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDashboard() {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="My Health Dashboard" sub="Sithum Fernando · +94 774 567 890" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Active Orders"       value="1"  sub="Out for delivery"  icon={ShoppingCart} color="blue" />
        <StatCard title="Prescriptions"       value="3"  sub="This month"        icon={FileText} color="green" />
        <StatCard title="Total Spent"         value="LKR 8,670" sub="This month" icon={TrendingUp} color="purple" />
      </div>

      {/* Mobile app-style card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Current Order — #ORD001</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium animate-pulse">Live</span>
          </div>
          <div className="space-y-3">
            {['Order Placed', 'Prescription Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i <= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {i <= 3 ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${i <= 3 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{step}</span>
                </div>
                {i === 3 && (
                  <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Estimated delivery in <span className="font-semibold text-slate-700 ml-1">12 minutes</span>
          </div>
        </div>

        {/* Quick Reorder */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Quick Reorder</h3>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {QUICK_REORDER.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">Last ordered {new Date(item.lastOrdered).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                  LKR {item.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Prescriptions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESCRIPTIONS.map((rx) => (
            <div key={rx.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-slate-800">{rx.medicines.length} medicines</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  rx.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                  rx.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                }`}>{rx.status.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-xs text-slate-500">{new Date(rx.uploadedAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })}</p>
              <p className="text-xs text-slate-400 mt-1">{rx.medicines.map(m => m.drug).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
