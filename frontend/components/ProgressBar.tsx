'use client';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  showLabel?: boolean;
  labelText?: string;
}

export default function ProgressBar({ percentage, height = 6, showLabel = false, labelText }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {labelText || 'Pool funded'}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
            {clamped.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
