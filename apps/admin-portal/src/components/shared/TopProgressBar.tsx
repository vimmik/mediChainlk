'use client';

interface TopProgressBarProps {
  loading?: boolean;
}

export function TopProgressBar({ loading }: TopProgressBarProps) {
  if (!loading) return null;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-fill" />
    </div>
  );
}
