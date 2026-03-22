'use client';

import React from 'react';
import { FrontierPoint } from '@/lib/optimizer';
import { ASSET_COLORS } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PortfolioScatterProps {
  minVarPoint: FrontierPoint | null;
  maxSharpePoint: FrontierPoint | null;
  equalWeightPoint: FrontierPoint | null;
  selectedPoint: FrontierPoint | null;
  onSelectRow: (pt: FrontierPoint) => void;
}

export default function PortfolioScatter({
  minVarPoint,
  maxSharpePoint,
  equalWeightPoint,
  selectedPoint,
  onSelectRow
}: PortfolioScatterProps) {
  
  const tablesPortfolios = [
    { label: 'Min Variance', pt: minVarPoint },
    { label: 'Max Sharpe', pt: maxSharpePoint },
    { label: 'Equal Weight (1/N)', pt: equalWeightPoint }
  ].filter(p => p.pt !== null) as { label: string, pt: FrontierPoint }[];

  const getTopHoldings = (pt: FrontierPoint) => {
    return Object.entries(pt.weights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a, w]) => `${a} (${(w*100).toFixed(0)}%)`)
      .join(', ');
  };

  const weightsData = selectedPoint ? 
    Object.entries(selectedPoint.weights)
      .filter(([_, w]) => w > 0.01)
      .map(([name, w]) => ({ name, value: w * 100 }))
      .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
      {/* LEFT: Table */}
      <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 16 }}>Optimal Portfolios</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'DM Sans', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-muted)', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '8px 0', fontWeight: 500 }}>Portfolio</th>
              <th style={{ padding: '8px 0', fontWeight: 500 }}>Return</th>
              <th style={{ padding: '8px 0', fontWeight: 500 }}>Vol</th>
              <th style={{ padding: '8px 0', fontWeight: 500 }}>Sharpe</th>
              <th style={{ padding: '8px 0', fontWeight: 500 }}>Top Holdings</th>
            </tr>
          </thead>
          <tbody>
            {tablesPortfolios.map(({ label, pt }, idx) => (
              <tr 
                key={idx} 
                onClick={() => onSelectRow(pt)}
                style={{ 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer',
                  backgroundColor: selectedPoint === pt ? 'var(--cream)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <td style={{ padding: '12px 0', fontWeight: 500 }}>{label}</td>
                <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono', color: 'var(--risk-green)' }}>{(pt.return * 100).toFixed(2)}%</td>
                <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono' }}>{(pt.vol * 100).toFixed(2)}%</td>
                <td style={{ padding: '12px 0', fontFamily: 'JetBrains Mono', color: 'var(--gold)' }}>{pt.sharpe.toFixed(2)}</td>
                <td style={{ padding: '12px 0', color: 'var(--ink-muted)', fontSize: 12 }}>{getTopHoldings(pt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RIGHT: Selected Point Weights Bar Chart */}
      <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 16 }}>
          Selected Portfolio Weights
        </h3>
        {selectedPoint ? (
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={weightsData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']} 
                  contentStyle={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }} 
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {weightsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(ASSET_COLORS as any)[entry.name] || 'var(--ink-muted)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', height: 200, alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            Click on a point in the chart or table to view weights
          </div>
        )}
      </div>
    </div>
  );
}
