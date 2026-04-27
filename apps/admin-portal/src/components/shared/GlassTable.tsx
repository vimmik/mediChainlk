interface GlassTableProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassTable({ children, className = '' }: GlassTableProps) {
  return (
    <div className={`glass-table ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function GlassTableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function GlassTableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}
