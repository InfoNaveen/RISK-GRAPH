'use client';

import React, { useMemo } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getVolatilities, stressCovariance, computeComponentRiskContribution, portfolioVariance } from '@/lib/math';
import { ASSET_COLORS } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function RiskAttributionChart() {
  const { tickers, portfolioWeights, alpha } = usePortfolio();
  const weights = portfolioWeights || {};

  const data = useMemo(() => {
    if (tickers.length === 0) return { donut: [], bars: [], sigmaP: 0 };

    const vols = getVolatilities(tickers);
    const weightArray = tickers.map(t => weights[t] || 0);
    const cov = stressCovariance(alpha, vols);
    
    const crc = computeComponentRiskContribution(weightArray, cov);
    const varP = portfolioVariance(weightArray, cov);
    const sigmaP = Math.sqrt(varP); // Daily fractional

    const donut = [];
    const bars = [];
    
    // Euler decomposition: sum of CRC = sigmaP
    for (let i = 0; i < tickers.length; i++) {
      const prc = sigmaP > 0 ? crc[i] / sigmaP : 0; // percentage risk contribution
      const w = weightArray[i];
      
      donut.push({
        asset: tickers[i],
        prc: prc,
        color: (ASSET_COLORS as any)[tickers[i]] || 'var(--ink-muted)'
      });

      bars.push({
        asset: tickers[i],
        weight: w * 100,
        prc: prc * 100,
        diff: (prc - w) * 100
      });
    }

    // Sort donut largest to smallest
    donut.sort((a, b) => b.prc - a.prc);
    bars.sort((a, b) => b.prc - a.prc);

    return { donut, bars, sigmaP: sigmaP * Math.sqrt(252) * 100 /* Annualized % */ };
  }, [tickers, weights, alpha]);

  if (tickers.length === 0) return null;

  // Render SVG Donut
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const isRed = p.diff > 0;
      return (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', fontSize: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)', fontWeight: 600, marginBottom: 8 }}>{p.asset}</div>
          <div style={{ color: 'var(--ink-muted)', marginBottom: 4 }}>Weight: {p.weight.toFixed(1)}%</div>
          <div style={{ color: 'var(--risk-red)', marginBottom: 4 }}>Risk Contrib: {p.prc.toFixed(1)}%</div>
          <div style={{ color: isRed ? 'var(--risk-red)' : 'var(--risk-green)', fontWeight: 600, marginTop: 4 }}>
            Diff: {p.diff > 0 ? '+' : ''}{p.diff.toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
      {/* LEFT: SVG Donut */}
      <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 24, width: '100%', textAlign: 'left' }}>Percentage Risk Contribution (PRC)</h3>
        
        <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 24 }}>
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="30" />
            {data.donut.map((item, idx) => {
              const strokeDasharray = `${Math.max(0, item.prc * circumference - 2)} ${circumference}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += item.prc * circumference;
              
              return (
                <circle 
                  key={idx}
                  cx="100" cy="100" r={radius} 
                  fill="none" 
                  stroke={item.color} 
                  strokeWidth="30"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dasharray 0.5s, stroke-dashoffset 0.5s' }}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>σ_p</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: 'var(--ink)', fontWeight: 600 }}>{data.sigmaP.toFixed(2)}%</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', fontSize: 11, fontFamily: 'DM Sans' }}>
          {data.donut.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              <span style={{ color: 'var(--ink)' }}>{item.asset}</span>
              <span style={{ color: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }}>{(item.prc * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Recharts Horizontal Bar */}
      <div style={{ flex: 1.5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 20 }}>Risk vs. Capital Allocation</h3>
        
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.bars} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
              <YAxis dataKey="asset" type="category" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'DM Sans' }} />
              
              <Bar dataKey="weight" name="Weight (Capital)" fill="var(--ink-muted)" />
              <Bar dataKey="prc" name="PRC (Risk)" fill="var(--risk-red)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
