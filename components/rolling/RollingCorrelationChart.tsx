'use client';

import React, { useMemo, useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RollingCorrelationChart() {
  const { tickers } = usePortfolio();
  
  const [asset1, setAsset1] = useState<string>('');
  const [asset2, setAsset2] = useState<string>('');

  // Fallback to defaults
  const a1 = asset1 || (tickers.length > 0 ? tickers[0] : '');
  const a2 = asset2 || (tickers.length > 1 ? tickers[1] : (tickers.length > 0 ? tickers[0] : ''));

  const data = useMemo(() => {
    if (!a1 || !a2) return { chartData: [], maxCorrel: 0 };

    const prices1 = SYNTHETIC_PRICES[a1 as keyof typeof SYNTHETIC_PRICES] || [];
    const prices2 = SYNTHETIC_PRICES[a2 as keyof typeof SYNTHETIC_PRICES] || [];

    if (prices1.length < 2 || prices2.length < 2) return { chartData: [], maxCorrel: 0 };
    
    const ret1 = [];
    const ret2 = [];
    for(let i=1; i<prices1.length; i++) {
        ret1.push(Math.log(prices1[i] / prices1[i-1]));
        ret2.push(Math.log(prices2[i] / prices2[i-1]));
    }

    const windowSize = 42;
    const chartData = [];
    let sumR = 0; let countR = 0;

    for(let t = windowSize; t < ret1.length; t++) {
        const w1 = ret1.slice(t - windowSize, t);
        const w2 = ret2.slice(t - windowSize, t);
        
        const m1 = w1.reduce((s,v)=>s+v,0)/windowSize;
        const m2 = w2.reduce((s,v)=>s+v,0)/windowSize;

        let cov = 0, var1 = 0, var2 = 0;
        for(let i=0; i<windowSize; i++) {
            cov += (w1[i]-m1)*(w2[i]-m2);
            var1 += Math.pow(w1[i]-m1, 2);
            var2 += Math.pow(w2[i]-m2, 2);
        }

        const correl = (var1>0 && var2>0) ? cov / Math.sqrt(var1*var2) : 0;
        sumR += correl; countR++;

        chartData.push({
            day: t,
            correl
        });
    }

    return { chartData, meanR: countR > 0 ? sumR/countR : 0 };

  }, [a1, a2]);

  if (tickers.length < 2) return null;

  const getLineColor = (mean: number) => {
    if (mean >= 0.6) return 'var(--risk-red)';
    if (mean <= 0.2) return 'var(--risk-green)';
    return 'var(--gold)';
  };

  const isHighlyCorrelated = data.chartData.some(d => d.correl > 0.7);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Rolling Correlation (42d)</h3>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={a1} onChange={e => setAsset1(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, background: 'var(--cream)' }}>
            {tickers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)', alignSelf: 'center' }}>vs</span>
          <select value={a2} onChange={e => setAsset2(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, background: 'var(--cream)' }}>
            {tickers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer>
          <LineChart data={data.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <Tooltip 
              formatter={(val: number) => [val.toFixed(2), 'ρ']}
              labelFormatter={(label) => `Day ${label}`}
              contentStyle={{ background: 'var(--cream)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono', fontSize: 12 }} 
            />
            
            <ReferenceLine y={0} stroke="var(--ink-muted)" strokeDasharray="3 3" />
            <ReferenceLine y={0.7} stroke="var(--gold)" strokeDasharray="5 5" label={{ value: 'High Correlation', fill: 'var(--gold)', fontSize: 10 }} />
            
            <Line type="monotone" dataKey="correl" stroke={getLineColor(data.meanR || 0)} strokeWidth={2} dot={false} isAnimationActive={false} />
            
          </LineChart>
        </ResponsiveContainer>
      </div>

      {isHighlyCorrelated && (
        <div style={{ marginTop: 16, background: 'rgba(201,168,76,0.1)', padding: '8px 16px', borderRadius: 4, color: 'var(--gold)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠</span> High correlation period detected — diversification dramatically reduced.
        </div>
      )}
    </div>
  );
}
