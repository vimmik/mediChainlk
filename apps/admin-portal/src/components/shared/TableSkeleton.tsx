interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 6, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="glass-table">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-left px-4 py-3">
                <div className="skeleton-shimmer h-3 w-20 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3.5">
                  <div
                    className="skeleton-shimmer h-4 rounded"
                    style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 0.08}s` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  cols?: number;
}

export function CardSkeleton({ count = 3, cols = 3 }: CardSkeletonProps) {
  const gridCls =
    cols === 2 ? 'grid-cols-1 md:grid-cols-2'
    : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className={`grid gap-4 ${gridCls}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
          <div className="skeleton-shimmer h-3 w-24 rounded" style={{ animationDelay: `${i * 0.1}s` }} />
          <div className="skeleton-shimmer h-8 w-16 rounded" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
          <div className="skeleton-shimmer h-3 w-32 rounded" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
        </div>
      ))}
    </div>
  );
}

interface DetailSkeletonProps {
  sections?: number;
  fieldsPerSection?: number;
}

export function DetailSkeleton({ sections = 3, fieldsPerSection = 6 }: DetailSkeletonProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer h-6 w-32 rounded" />
        <div className="skeleton-shimmer h-5 w-20 rounded-full" />
      </div>
      {Array.from({ length: sections }).map((_, si) => (
        <div key={si} className="section-glass space-y-4">
          <div className="skeleton-shimmer h-3 w-36 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: fieldsPerSection }).map((_, fi) => (
              <div key={fi} className="space-y-1.5">
                <div className="skeleton-shimmer h-2.5 w-16 rounded" style={{ animationDelay: `${fi * 0.05}s` }} />
                <div className="skeleton-shimmer h-4 w-28 rounded" style={{ animationDelay: `${fi * 0.05 + 0.03}s` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
