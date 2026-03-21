import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  children?: ReactNode;
}

export default function MetricCard({ label, value, subtext, color, children }: MetricCardProps) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '20px 24px',
      background: 'var(--surface)',
      minWidth: 0,
    }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: 'var(--ink-muted)',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div className="font-num" style={{
        fontSize: 28,
        fontWeight: 300,
        color: color || 'var(--ink)',
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {subtext && (
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'var(--ink-muted)',
          marginTop: 6,
        }}>
          {subtext}
        </div>
      )}
      {children}
    </div>
  );
}
