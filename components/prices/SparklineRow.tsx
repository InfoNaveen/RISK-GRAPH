import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
}

export default function SparklineRow({ data, color = 'var(--gold)' }: SparklineProps) {
  if (data.length === 0) return null;

  // We want the last 60 days
  const slice = data.slice(-60);
  if (slice.length < 2) return null;

  const min = Math.min(...slice);
  const max = Math.max(...slice);
  
  const width = 120;
  const height = 24;

  const range = max - min === 0 ? 1 : max - min;
  
  const points = slice.map((val, i) => {
    const x = (i / (slice.length - 1)) * width;
    const y = height - ((val - min) / range) * height; // invert Y
    return `${x},${y}`;
  }).join(' L ');

  const pathD = `M ${points}`;

  const isPositive = slice[slice.length - 1] >= slice[0];
  const strokeColor = color === 'var(--gold)' ? color : (isPositive ? 'var(--risk-green)' : 'var(--risk-red)');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
