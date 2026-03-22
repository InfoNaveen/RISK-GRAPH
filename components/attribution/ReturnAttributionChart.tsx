'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { ASSET_COLORS } from '@/lib/types';

export default function ReturnAttributionChart() {
  const { tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights || {};

  const waterfallData = useMemo(() => {
    if (tickers.length === 0) return [];

    let totalReturn = 0;
    const items = tickers.map(t => {
      const prices = SYNTHETIC_PRICES[t as keyof typeof SYNTHETIC_PRICES] || [];
      if (prices.length < 2) return { asset: t, contrib: 0 };
      
      const pStart = prices[0];
      const pEnd = prices[prices.length - 1];
      const ret = (pEnd - pStart) / pStart;
      const w = weights[t] || 0;
      const contrib = w * ret * 100; // as %
      
      totalReturn += contrib;
      return { asset: t, contrib };
    });

    items.sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib)); // Largest impact first

    // Build cumulative steps for waterfall
    const steps = [];
    let current = 0;
    for (const item of items) {
      steps.push({
        asset: item.asset,
        start: current,
        end: current + item.contrib,
        value: item.contrib,
        color: item.contrib >= 0 ? 'var(--risk-green)' : 'var(--risk-red)',
        assetColor: (ASSET_COLORS as any)[item.asset] || 'var(--ink-muted)'
      });
      current += item.contrib;
    }

    // Add total final bar
    steps.push({
      asset: 'TOTAL',
      start: 0,
      end: current,
      value: current,
      color: 'var(--ink)',
      assetColor: 'var(--ink)'
    });

    return steps;
  }, [tickers, weights]);

  if (waterfallData.length === 0) return null;

  // SVG dimensions
  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // Scales
  const MAX_ABS = Math.max(...waterfallData.map(d => Math.max(Math.abs(d.start), Math.abs(d.end))));
  const yMax = MAX_ABS * 1.2;
  const yMin = Math.min(0, Math.min(...waterfallData.map(d => Math.min(d.start, d.end))) * 1.2);

  const getY = (val: number) => {
    return margin.top + graphHeight - ((val - yMin) / (yMax - yMin)) * graphHeight;
  };

  const zeroY = getY(0);
  const barWidth = Math.min(60, graphWidth / waterfallData.length * 0.7);
  const gap = (graphWidth - (barWidth * waterfallData.length)) / (waterfallData.length + 1);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginBottom: 24, overflowX: 'auto' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 20 }}>Return Attribution (Brinson Model Equivalent)</h3>
      <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
        Breakdown of the 252-day portfolio return into individual asset contributions ($w_i \times r_i$).
      </p>

      <svg width={width} height={height} style={{ minWidth: 600 }}>
        {/* Y Axis Grid & Labels */}
        {[0, 25, 50, 75, 100].map(pct => {
          const val = yMin + ((yMax - yMin) * (pct / 100));
          const y = getY(val);
          return (
            <g key={pct}>
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="var(--ink-muted)" fontSize="10" fontFamily="JetBrains Mono">
                {val > 0 ? '+' : ''}{val.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* Zero Line */}
        <line x1={margin.left} y1={zeroY} x2={width - margin.right} y2={zeroY} stroke="var(--ink-muted)" strokeWidth="1" />

        {/* Bars and Connectors */}
        {waterfallData.map((d, i) => {
          const x = margin.left + gap + i * (barWidth + gap);
          const yStart = getY(d.start);
          const yEnd = getY(d.end);
          const yTop = Math.min(yStart, yEnd);
          const h = Math.abs(yStart - yEnd) || 2; // at least 2px height
          
          return (
            <g key={i}>
              {/* Connector from previous bar (except first) */}
              {i > 0 && i < waterfallData.length - 1 && (
                <line 
                  x1={margin.left + gap + (i-1) * (barWidth + gap) + barWidth} 
                  y1={yStart} 
                  x2={x} 
                  y2={yStart} 
                  stroke="var(--ink-muted)" 
                  strokeDasharray="2 2" 
                />
              )}
              
              {/* Main Bar */}
              <rect x={x} y={yTop} width={barWidth} height={h} fill={d.color} />
              
              {/* Value Label */}
              <text 
                x={x + barWidth / 2} 
                y={d.value >= 0 ? yTop - 8 : yTop + h + 15} 
                textAnchor="middle" 
                fill="var(--ink)" 
                fontSize="11" 
                fontFamily="JetBrains Mono"
                fontWeight={d.asset === 'TOTAL' ? 'bold' : 'normal'}
              >
                {d.value > 0 ? '+' : ''}{d.value.toFixed(2)}%
              </text>

              {/* Asset Name Label */}
              <text 
                x={x + barWidth / 2} 
                y={height - 15} 
                textAnchor="middle" 
                fill={d.assetColor} 
                fontSize="10" 
                fontFamily="DM Sans" 
                fontWeight={d.asset === 'TOTAL' ? 'bold' : 'normal'}
              >
                {d.asset}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
