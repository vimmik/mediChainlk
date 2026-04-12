export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-bold text-slate-900 leading-tight tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-slate-500 mt-1 leading-snug">{sub}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

