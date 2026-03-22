'use client';

import React, { useMemo, useState } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';
import { SYNTHETIC_PRICES } from '@/lib/priceData';
import { ASSET_COLORS } from '@/lib/types';
import { computeRollingVolatility } from '@/lib/math';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RollingVolChart() {
  const { tickers, portfolioWeights } = usePortfolio();
  const weights = portfolioWeights || {};
  const [windowSize, setWindowSize] = useState<number>(21);
  const [visibleAssets, setVisibleAssets] = useState<Record<string, boolean>>({});

  const data = useMemo(() => {
    if (tickers.length === 0) return [];

    const returnsMap: Record<string, number[]> = {};
    const nSteps = (SYNTHETIC_PRICES[tickers[0] as keyof typeof SYNTHETIC_PRICES] || []).length;
    if (nSteps < 2) return [];

    tickers.forEach(t => {
      const prices = SYNTHETIC_PRICES[t as keyof typeof SYNTHETIC_PRICES] || [];
      const ret = [];
      for (let i = 1; i < prices.length; i++) {
        ret.push(Math.log(prices[i] / prices[i - 1]));
      }
      returnsMap[t] = ret;
    });

    const rollingVolMap: Record<string, number[]> = {};
    tickers.forEach(t => {
      rollingVolMap[t] = computeRollingVolatility(returnsMap[t], windowSize);
    });

    const weightArray = tickers.map(t => weights[t] || 0);

    const chartData = [];
    // Start from `windowSize` since previous days emit NaN naturally but let's just chart them
    for (let t = windowSize; t < nSteps - 1; t++) {
      const row: any = { day: t };
      
      // Compute portfolio returns up to exactly this timestep for rolling vol
      const winReturns = [];
      for (let dt = t - windowSize + 1; dt <= t; dt++) {
        let pRet = 0;
        tickers.forEach((ticker, i) => {
          pRet += weightArray[i] * returnsMap[ticker][dt];
        });
        winReturns.push(pRet);
      }
      const mean = winReturns.reduce((s, v) => s + v, 0) / windowSize;
      const vari = winReturns.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (windowSize - 1);
      const ptVol = Math.sqrt(vari) * Math.sqrt(252);
      
      row['Portfolio'] = ptVol * 100;
      tickers.forEach(ticker => {
        row[ticker] = rollingVolMap[ticker][t] * 100;
      });
      chartData.push(row);
    }
    
    return chartData;
  }, [tickers, weights, windowSize]);

  if (tickers.length === 0) return null;

  const toggleAsset = (asset: string) => {
    setVisibleAssets(prev => ({
      ...prev,
      [asset]: prev[asset] === undefined ? false : !prev[asset] // Default true implies missing
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', padding: '12px', borderRadius: '4px', fontSize: 12 }}>
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--ink)', marginBottom: 8, fontWeight: 600 }}>Day {label}</div>
        {payload.map((p: any, idx: number) => (
          <div key={idx} style={{ color: p.color, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
            {p.name}: {p.value.toFixed(1)}%
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Rolling Volatility</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[21, 42, 63].map(w => (
            <button 
              key={w}
              onClick={() => setWindowSize(w)}
              className="btn-outline" 
              style={{ 
                padding: '4px 8px', 
                fontSize: 11, 
                backgroundColor: windowSize === w ? 'var(--gold)' : 'transparent',
                borderColor: windowSize === w ? 'var(--gold)' : 'var(--border)'
              }}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'var(--ink-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            
            <Line type="monotone" dataKey="Portfolio" stroke="var(--ink)" strokeWidth={3} dot={false} isAnimationActive={false} />
            
            {tickers.map(t => (
              visibleAssets[t] !== false ? (
                <Line 
                  key={t} 
                  type="monotone" 
                  dataKey={t} 
                  stroke={(ASSET_COLORS as any)[t] || 'var(--ink-muted)'} 
                  strokeWidth={1.5} 
                  dot={false} 
                  isAnimationActive={false} 
                  strokeOpacity={0.6}
                />
              ) : null
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        {tickers.map(t => {
          const isVisible = visibleAssets[t] !== false;
          return (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans', opacity: isVisible ? 1 : 0.5 }}>
              <input type="checkbox" checked={isVisible} onChange={() => toggleAsset(t)} style={{ accentColor: (ASSET_COLORS as any)[t] || 'var(--gold)' }} />
              {t}
            </label>
          )
        })}
      </div>
    </div>
  );
}
