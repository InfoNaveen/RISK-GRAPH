import React from 'react';
import { formatINR } from '@/lib/math';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface TaxDonutChartProps {
  slabTax: number;
  stcgTax: number;
  ltcgTax: number;
  surcharge: number;
  cess: number;
  totalTax: number;
}

export default function TaxDonutChart({
  slabTax,
  stcgTax,
  ltcgTax,
  surcharge,
  cess,
  totalTax,
}: TaxDonutChartProps) {
  if (totalTax === 0) return null;

  const segments: Segment[] = [
    { label: 'Slab Tax', value: slabTax, color: 'var(--ink)' },
    { label: 'STCG Tax', value: stcgTax, color: 'var(--risk-red)' },
    { label: 'LTCG Tax', value: ltcgTax, color: 'var(--gold)' },
    { label: 'Surcharge', value: surcharge, color: 'var(--ink-muted)' },
    { label: 'Cess', value: cess, color: '#888' },
  ].filter(s => s.value > 0);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 24;
  const radius = cx - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        {segments.map((segment, index) => {
          const dashArray = (segment.value / totalTax) * circumference;
          const strokeDasharray = `${dashArray} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += dashArray;

          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          );
        })}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dy=".3em"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18,
            fontWeight: 300,
            fill: 'var(--ink)',
          }}
        >
          {formatINR(totalTax)}
        </text>
      </svg>
      
      <div style={{ marginTop: 24, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, background: s.color, borderRadius: 2 }} />
              <span style={{ color: 'var(--ink)' }}>{s.label}</span>
            </div>
            <span className="font-num">{formatINR(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
