'use client';

import React, { useMemo } from 'react';
import { ScenarioDefinition, applyScenario } from '@/lib/scenarios';
import { usePortfolio } from '@/lib/PortfolioContext';
import { formatINRPrecise } from '@/lib/math';
import { ASSET_COLORS } from '@/lib/types';

interface ScenarioImpactChartProps {
  scenario: ScenarioDefinition;
  totalValue: number; // E.g. 10,000,000 default if we don't have a global state for it
  weights?: Record<string, number>;
}

export default function ScenarioImpactChart({ scenario, totalValue, weights }: ScenarioImpactChartProps) {
  const { tickers, portfolioWeights } = usePortfolio();

  const data = useMemo(() => {
    if (tickers.length === 0) return null;
    // Use passed weights — fallback to equal weight if missing
    const resolvedWeights = weights && 
      Object.keys(weights).length > 0 
        ? weights 
        : Object.fromEntries(
            Object.keys(scenario.shocks).map(k => 
              [k, 1 / Object.keys(scenario.shocks).length]
            )
          );
    const result = applyScenario(
      scenario, 
      resolvedWeights, 
      totalValue
    );
    
    // Waterfall steps
    const items = Object.entries(result.assetImpacts)
      .filter(([_, v]) => Math.abs(v) > 0.0001)
      .map(([asset, value]) => ({ 
        asset, 
        value: value * totalValue, 
        weight: resolvedWeights[asset], 
        shock: scenario.shocks[asset] || 0 
      }));
      
    items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)); // sorts by largest absolute impact

    const steps = [];
    let current = totalValue;
    
    // Initial value bar
    steps.push({
      label: 'Initial Value',
      start: 0,
      end: current,
      value: current,
      color: 'var(--ink)',
      isBase: true
    });

    for (const item of items) {
      steps.push({
        label: item.asset,
        start: current,
        end: current + item.value,
        value: item.value,
        color: item.value >= 0 ? 'var(--risk-green)' : 'var(--risk-red)',
        isBase: false
      });
      current += item.value;
    }

    // Final value bar
    steps.push({
      label: 'Stressed Value',
      start: 0,
      end: current,
      value: current,
      color: 'var(--ink)',
      isBase: true
    });

    return { steps, result, items };
  }, [tickers, portfolioWeights, scenario, totalValue]);

  if (!data) return null;

  // SVG parameters
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // Domain calculations
  const yMax = Math.max(totalValue, data.result.survivingValue) * 1.1; // 10% headroom
  let minPoint = Math.min(...data.steps.map(s => Math.min(s.start, s.end)));
  const yMin = Math.min(0, minPoint * 0.9); // Only go below 0 if some total dropped below 0

  const getY = (val: number) => margin.top + graphHeight - ((val - yMin) / (yMax - yMin)) * graphHeight;
  const zeroY = getY(0);
  const barWidth = Math.min(40, graphWidth / data.steps.length * 0.7);
  const gap = (graphWidth - (barWidth * data.steps.length)) / (data.steps.length + 1);

  // Recovery Math
  const impactPctString = (data.result.portfolioImpact * 100).toFixed(1);
  const recoveryNeeded = data.result.portfolioImpact < 0 
    ? ((1 / (1 + data.result.portfolioImpact)) - 1) * 100 
    : 0;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8 }}>Impact Details: {scenario.name}</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 600 }}>Detailed breakdown of how each asset position absorbs or amplifies the shock.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        
        {/* Waterfall Chart */}
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 4, padding: '24px 0' }}>
          <svg width={width} height={height} style={{ minWidth: 600 }}>
            {/* Y Axis */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const val = yMin + ((yMax - yMin) * pct);
              const y = getY(val);
              return (
                <g key={pct}>
                  <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
                  <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="var(--ink-muted)" fontSize="10" fontFamily="JetBrains Mono">
                    {formatINRPrecise(val / 100000).replace('₹', '')}L
                  </text>
                </g>
              );
            })}

            <line x1={margin.left} y1={zeroY} x2={width - margin.right} y2={zeroY} stroke="var(--ink-muted)" />

            {/* Bars */}
            {data.steps.map((d, i) => {
              const x = margin.left + gap + i * (barWidth + gap);
              const yStart = getY(d.start);
              const yEnd = getY(d.end);
              const yTop = Math.min(yStart, yEnd);
              const h = Math.abs(yStart - yEnd) || 2;
              
              return (
                <g key={i}>
                  {i > 0 && (
                    <line 
                      x1={margin.left + gap + (i-1) * (barWidth + gap) + barWidth} 
                      y1={getY(data.steps[i-1].end)} 
                      x2={x} 
                      y2={getY(data.steps[i-1].end)} 
                      stroke="var(--ink-muted)" 
                      strokeDasharray="2 2" 
                    />
                  )}
                  
                  <rect x={x} y={yTop} width={barWidth} height={h} fill={d.color} />
                  
                  {/* Label below bar */}
                  <text 
                    x={x + barWidth / 2} 
                    y={height - 40} 
                    textAnchor="end"
                    transform={`rotate(-45, ${x + barWidth / 2}, ${height - 40})`}
                    fill="var(--ink)" 
                    fontSize="10" 
                    fontFamily="DM Sans" 
                    fontWeight={d.isBase ? 'bold' : 'normal'}
                  >
                    {d.label}
                  </text>

                  {/* Impact amount */}
                  {!d.isBase && (
                    <text 
                      x={x + barWidth / 2} 
                      y={d.value >= 0 ? yTop - 8 : yTop + h + 15} 
                      textAnchor="middle" 
                      fill="var(--ink-muted)" 
                      fontSize="9" 
                      fontFamily="JetBrains Mono"
                    >
                      {d.value > 0 ? '+' : ''}{((d.value/totalValue)*100).toFixed(1)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Breakdown Table */}
        <div style={{ width: 350, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'DM Sans', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 0', fontWeight: 500 }}>Asset</th>
                  <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Weight</th>
                  <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Shock</th>
                  <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Impact</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 0', fontWeight: 500 }}>{item.asset}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono', color: 'var(--ink-muted)' }}>{(item.weight * 100).toFixed(1)}%</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono', color: item.shock < 0 ? 'var(--risk-red)' : 'var(--risk-green)' }}>
                      {item.shock > 0 ? '+' : ''}{(item.shock * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'JetBrains Mono', color: item.value < 0 ? 'var(--risk-red)' : 'var(--risk-green)' }}>
                      {item.value > 0 ? '+' : ''}{((item.value/totalValue)*100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 4, padding: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Total Impact</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: data.result.portfolioImpact < 0 ? 'var(--risk-red)' : 'var(--risk-green)' }}>
                {data.result.portfolioImpact > 0 ? '+' : ''}{impactPctString}% ({formatINRPrecise(data.result.survivingValue - totalValue)})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Remaining Value</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--ink)' }}>
                {formatINRPrecise(data.result.survivingValue)}
              </span>
            </div>
            {recoveryNeeded > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Recovery Needed</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--ink)' }}>
                  +{recoveryNeeded.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
