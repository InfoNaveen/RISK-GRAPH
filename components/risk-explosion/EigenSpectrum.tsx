'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { usePortfolio } from '@/lib/PortfolioContext';
import { getCorrelationSubMatrix, computeAllEigenvalues } from '@/lib/math';

export default function EigenSpectrum() {
  const { tickers } = usePortfolio();

  const chartData = useMemo(() => {
    if (tickers.length === 0) return { data: [], lambdaMax: 0, srr: 0, mpBound: 0 };
    
    // Uses empirical static assumption matrix
    const corr = getCorrelationSubMatrix(tickers);
    const eigenvals = computeAllEigenvalues(corr);
    
    const n = tickers.length;
    // T = 252 (simulated days)
    const T = 252;
    const mpBound = Math.pow(1 + Math.sqrt(n / T), 2);
    
    const data = eigenvals.map((val, idx) => ({
      name: `λ${idx + 1}`,
      value: val,
      isSignals: val > mpBound,
      isMax: idx === 0
    }));

    return {
      data,
      lambdaMax: eigenvals.length > 0 ? eigenvals[0] : 0,
      srr: eigenvals.length > 0 ? eigenvals[0] / n : 0,
      mpBound
    };
  }, [tickers]);

  if (tickers.length === 0) return null;

  const { data, lambdaMax, srr, mpBound } = chartData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '10px', borderRadius: '4px', fontSize: 12 }}>
          <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)' }}>{p.name} = {p.value.toFixed(4)}</div>
          <div style={{ color: p.isSignals ? 'var(--gold)' : 'var(--ink-muted)', marginTop: 4 }}>
            {p.isSignals ? 'Above' : 'Below'} random matrix threshold
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 20 }}>Spectral Analysis</h3>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, padding: 16, background: 'var(--cream)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Principal Eigenvalue (λ_max)</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, color: 'var(--risk-red)', fontWeight: 600 }}>
            {lambdaMax.toFixed(2)}
          </div>
        </div>
        <div style={{ flex: 1, padding: 16, background: 'var(--cream)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Spectral Risk Ratio</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 24, color: 'var(--gold)', fontWeight: 600 }}>
            {(srr * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ height: 200, width: '100%' }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={mpBound} stroke="var(--gold)" strokeDasharray="3 3" label={{ position: 'top', value: 'MP upper bound', fill: 'var(--gold)', fontSize: 10 }} />
            
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isMax ? 'var(--risk-red)' : entry.isSignals ? 'var(--gold)' : 'var(--ink-muted)'} 
                  fillOpacity={entry.isMax || entry.isSignals ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
