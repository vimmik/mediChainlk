'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { REVENUE_CHART } from '@/lib/mock-data';
import { TrendingUp, ShoppingCart, DollarSign, Cpu, Download } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const CATEGORIES = [
  { label: 'Chronic Medications', pct: 45, color: 'bg-blue-500' },
  { label: 'Acute / Short-term',  pct: 30, color: 'bg-purple-500' },
  { label: 'Over the Counter',    pct: 25, color: 'bg-green-500' },
];

const MONTHLY_ORDERS = [
  { month: 'Oct', orders: 198 },
  { month: 'Nov', orders: 224 },
  { month: 'Dec', orders: 261 },
  { month: 'Jan', orders: 243 },
  { month: 'Feb', orders: 289 },
  { month: 'Mar', orders: 314 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Analytics & Reports"
        sub="Platform-wide insights · April 2026"
        action={
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value="LKR 1.02M"
          sub="6-month cumulative"
          icon={TrendingUp}
          color="blue"
          trend={{ value: '+9.5% MoM', up: true }}
        />
        <StatCard
          title="Total Orders"
          value="314"
          sub="This month"
          icon={ShoppingCart}
          color="green"
          trend={{ value: '+8.7% MoM', up: true }}
        />
        <StatCard
          title="Avg Order Value"
          value="LKR 3,248"
          sub="Per transaction"
          icon={DollarSign}
          color="purple"
          trend={{ value: '+2.1%', up: true }}
        />
        <StatCard
          title="AI Accuracy"
          value="94.2%"
          sub="OCR + NLP pipeline"
          icon={Cpu}
          color="amber"
          trend={{ value: '+1.4% vs Q1', up: true }}
        />
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Revenue Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Oct 2025 – Mar 2026 · All pharmacies</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-xs text-slate-500">Revenue (LKR)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={REVENUE_CHART} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip
              formatter={(v: number) => [`LKR ${v.toLocaleString()}`, 'Revenue']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Volume */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-800 text-base">Order Volume</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monthly order count across all pharmacies</p>
          </div>
          <div className="space-y-3 mt-4">
            {MONTHLY_ORDERS.map((row) => (
              <div key={row.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8">{row.month}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${(row.orders / 350) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right tabular-nums">{row.orders}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-800 text-base">Order Categories</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution by prescription type</p>
          </div>
          <div className="space-y-4 mt-4">
            {CATEGORIES.map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700 font-medium">{label}</span>
                  <span className="text-sm font-bold text-slate-800 tabular-nums">{pct}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-2 text-center">
              {CATEGORIES.map(({ label, pct, color }) => (
                <div key={label} className="p-2.5 rounded-lg bg-slate-50">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${color}`} />
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{pct}%</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{label.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Metrics */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-sm">
        <h3 className="font-bold text-base mb-4">Platform Health Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Uptime', value: '99.98%' },
            { label: 'API Response', value: '124ms' },
            { label: 'AI Pipeline', value: '1.8s avg' },
            { label: 'Prescriptions Processed', value: '1,247' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-blue-200 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
