'use client';

import { useState } from 'react';
import { ASSET_NAMES } from '@/lib/types';

interface ContagionHeatmapProps {
  matrix: number[][];
  assets?: readonly string[];
}

function heatmapColor(v: number): string {
  // white (0) → gold (0.5) → crimson (1.0)
  const clamped = Math.max(0, Math.min(1, v));
  if (clamped <= 0.5) {
    const t = clamped / 0.5;
    const r = Math.round(255 + (201 - 255) * t);
    const g = Math.round(255 + (168 - 255) * t);
    const b = Math.round(255 + (76 - 255) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (clamped - 0.5) / 0.5;
    const r = Math.round(201 + (220 - 201) * t);
    const g = Math.round(168 + (20 - 168) * t);
    const b = Math.round(76 + (60 - 76) * t);
    return `rgb(${r},${g},${b})`;
  }
}

export default function ContagionHeatmap({ matrix, assets = ASSET_NAMES }: ContagionHeatmapProps) {
  const n = assets.length;
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const cellSize = 48;
  const labelWidth = 70;
  const totalW = labelWidth + n * cellSize;
  const totalH = labelWidth + n * cellSize;

  return (
    <div style={{ position: 'relative', overflowX: 'auto' }}>
      <svg width={totalW} height={totalH + 10}>
        {/* X-axis labels */}
        {assets.map((name, j) => (
          <text
            key={`x-${j}`}
            x={labelWidth + j * cellSize + cellSize / 2}
            y={labelWidth - 6}
            textAnchor="end"
            transform={`rotate(-45, ${labelWidth + j * cellSize + cellSize / 2}, ${labelWidth - 6})`}
            fontSize={9}
            fontFamily="'DM Sans', sans-serif"
            fill="var(--ink-muted)"
          >
            {name}
          </text>
        ))}

        {/* Y-axis labels */}
        {assets.map((name, i) => (
          <text
            key={`y-${i}`}
            x={labelWidth - 6}
            y={labelWidth + i * cellSize + cellSize / 2 + 3}
            textAnchor="end"
            fontSize={9}
            fontFamily="'DM Sans', sans-serif"
            fill="var(--ink-muted)"
          >
            {name}
          </text>
        ))}

        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((val, j) => {
            // Normalize: for covariance, extract correlation
            const corr = Math.min(1, Math.max(0, val));
            return (
              <rect
                key={`${i}-${j}`}
                x={labelWidth + j * cellSize}
                y={labelWidth + i * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={heatmapColor(corr)}
                stroke="var(--cream)"
                strokeWidth={1}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setTooltip({
                    x: rect.x + cellSize / 2,
                    y: rect.y - 30,
                    text: `${assets[i]} ↔ ${assets[j]}: ${val.toFixed(3)}`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })
        )}
      </svg>

      {tooltip && (
        <div className="tooltip" style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
